import { Injectable, Logger, NotFoundException, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsappFlota } from './entities/whatsapp.entity';
import { User } from '../users/entities/user.entity';
import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';
import { ConectarNumeroDto } from './dto/conectar-numero.dto';
import * as fs from 'fs';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private clients = new Map<string, Client>();
  private isGeneratingQR = false;
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    @InjectRepository(WhatsappFlota)
    private readonly whatsappRepo: Repository<WhatsappFlota>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async onModuleInit() {
    this.logger.log('Reiniciando sesiones de WhatsApp existentes...');
    const flota = await this.obtenerTodaLaFlota();
    for (const agente of flota) {
      if (agente.usuario) this.createSession(agente.usuario.id);
    }
  }

  // --- Genera un QR temporal ---
  async startNewSession(): Promise<string> {
    if (this.isGeneratingQR) {
      throw new InternalServerErrorException('Ya se está generando un QR. Intenta más tarde.');
    }
    this.isGeneratingQR = true;
    const tempId = `session-temp-${Date.now()}`;

    const client = new Client({
      authStrategy: new LocalAuth({ clientId: tempId, dataPath: './.wwebjs_auth' }),
      puppeteer: {
        
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
headless: false
    },
    });

    return new Promise((resolve, reject) => {
      const destroy = (err) => {
        this.isGeneratingQR = false;
        client.destroy().catch(e => this.logger.error('Error destruyendo cliente temporal:', e));
        reject(err);
      };

      const timeout = setTimeout(() => destroy(new InternalServerErrorException('Timeout generando QR')), 120000);

      client.once('qr', qr => {
        clearTimeout(timeout);
        qrcode.toDataURL(qr, (err, url) => {
          if (err) return destroy(err);
          this.isGeneratingQR = false;
          
          resolve(url);
        });
      });

     client.on('auth_failure', (msg) => {
  this.logger.error('Fallo de autenticación temporal:', msg);
});
      client.initialize().catch(err => destroy(new InternalServerErrorException(err.message)));
    });
  }

  // --- Crea o reinicia la sesión de un vendedor ---
  private createSession(userId: string) {
    if (this.clients.has(userId)) return;

    const client = new Client({
      authStrategy: new LocalAuth({ clientId: userId, dataPath: './.wwebjs_auth' }),
      puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] },
    });

 client.on('ready', () => {
  this.logger.log(`Sesión activa para usuario ${userId}`);
  this.clients.set(userId, client);
});

    client.on('disconnected', reason => {
      this.logger.log(`Usuario ${userId} desconectado: ${reason}`);
      client.destroy().catch(() => {});
      this.clients.delete(userId);
    });

    client.initialize().catch(err => this.logger.error(`No se pudo inicializar sesión ${userId}: ${err.message}`));
  }

  // --- Maneja mensajes entrantes y alerta si no se responde ---
  private async handleIncomingMessage(userId: string, msg: any) {
    if (msg.fromMe) return; // Ignorar mensajes salientes
    const chat = await msg.getChat();

    const flota = await this.whatsappRepo.findOne({ where: { usuario: { id: userId } } });
    const timeoutSec = flota?.alerta_timeout || 300;

    setTimeout(async () => {
      const messages = await chat.fetchMessages({ limit: 1 });
      const lastMsg = messages[0];
      if (!lastMsg.fromMe) {
        this.logger.warn(`ALERTA: Mensaje no respondido de ${chat.name} (${chat.id._serialized}) por más de ${timeoutSec} segundos`);
      }
    }, timeoutSec * 1000);
  }

  async getConversations(sellerId: string) {
    const client = this.clients.get(sellerId);
    if (!client) throw new NotFoundException(`Vendedor ${sellerId} no conectado`);

    const chats = await client.getChats();
    return chats.filter(c => !c.isGroup && c.lastMessage).map(chat => ({
      id: chat.id._serialized,
      nombre_cliente: chat.name,
      numero_cliente: chat.id.user,
      ultimo_mensaje: chat.lastMessage.body,
      mensajes_no_leidos: chat.unreadCount,
    }));
  }

  async getMessagesFromChat(chatId: string) {
    for (const client of this.clients.values()) {
      try {
        const chat = await client.getChatById(chatId);
        if (chat) {
          const messages = await chat.fetchMessages({ limit: 50 });
          return messages.map(msg => ({
            id: msg.id._serialized,
            cuerpo: msg.body,
            timestamp: msg.timestamp * 1000,
            es_del_cliente: !msg.fromMe,
          }));
        }
      } catch {}
    }
    throw new NotFoundException(`Chat ${chatId} no encontrado`);
  }

  async conectarNumero(dto: ConectarNumeroDto) {
    const usuario = await this.userRepo.findOneBy({ id: dto.usuario_id });
    if (!usuario) throw new NotFoundException(`Usuario ${dto.usuario_id} no encontrado`);

    const nuevaConexion = this.whatsappRepo.create({
      ...dto,
      usuario,
      estado: 'Iniciando',
    });
    const saved = await this.whatsappRepo.save(nuevaConexion);
    this.createSession(dto.usuario_id);
    return saved;
  }

  async obtenerTodaLaFlota() {
    return this.whatsappRepo.find({ relations: ['usuario'] });
  }

  async desconectarNumero(id: string) {
    const conexion = await this.whatsappRepo.findOne({ where: { id }, relations: ['usuario'] });
    if (!conexion) throw new NotFoundException(`Conexión ${id} no encontrada`);

    const client = this.clients.get(conexion.usuario.id);
    if (client) {
      await client.destroy();
      this.clients.delete(conexion.usuario.id);
    }

    const sessionPath = `./.wwebjs_auth/session-${conexion.usuario.id}`;
    if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });

    await this.whatsappRepo.delete(id);
    return { message: 'Sesión eliminada y conexión borrada' };
  }
}
