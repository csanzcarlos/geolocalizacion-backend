import { 
  Injectable, 
  Logger, 
  NotFoundException, 
  InternalServerErrorException, 
  OnModuleInit,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsappFlota } from './entities/whatsapp-flota.entity';
import { User } from '../users/entities/user.entity';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';
import * as fs from 'fs';
import { SendMessageDto } from './dto/send-message.dto'; // <-- Importa el DTO aquí también


@Injectable()
export class WhatsappService implements OnModuleInit {
  private clients = new Map<string, Client>();
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
      if (agente.usuario && agente.estado === 'Conectado') {
        this.logger.log(`Intentando reconectar a: ${agente.nombre_agente}`);
        this.createOrRestartSession(agente.usuario.id);
      }
    }
  }

  async generarQrParaUsuario(userId: string): Promise<{ qr: string }> {
    if (this.clients.has(userId)) {
      throw new BadRequestException('Este usuario ya tiene una sesión activa.');
    }
    
    const usuario = await this.userRepo.findOneBy({ id: userId });
    if (!usuario) throw new NotFoundException(`Usuario con ID ${userId} no encontrado.`);

    let client: Client | null = new Client({
      authStrategy: new LocalAuth({ clientId: userId, dataPath: './.wwebjs_auth' }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      }
    });
    
    let isDone = false;

    const cleanup = (c: Client | null) => {
      if (c) {
        c.destroy().catch(err => this.logger.error('Error menor durante limpieza del cliente:', err.message));
      }
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (isDone) return;
        isDone = true;
        cleanup(client);
        reject(new InternalServerErrorException('Timeout: El QR no fue escaneado a tiempo.'));
      }, 120000);

      client.once('qr', qr => {
        qrcode.toDataURL(qr)
          .then(url => resolve({ qr: url }))
          .catch(err => {
            if (isDone) return;
            isDone = true;
            clearTimeout(timeout);
            cleanup(client);
            reject(new InternalServerErrorException('Error al generar la URL del QR.'));
          });
      });

      client.once('ready', async () => {
        if (isDone) return;
        isDone = true;
        clearTimeout(timeout);
        this.logger.log(`✅ Conexión exitosa para: ${usuario.nombre}`);
        
        let flota = await this.whatsappRepo.findOne({ where: { usuario: { id: userId } } });
        if (!flota) {
          flota = this.whatsappRepo.create({ usuario });
        }
        
        flota.nombre_agente = usuario.nombre;
        flota.numero_whatsapp = client.info.wid.user;
        flota.estado = 'Conectado';
        
        await this.whatsappRepo.save(flota);
        
        this.clients.set(userId, client);
        client.on('message', msg => this.handleIncomingMessage(userId, msg));
      });

      client.on('disconnected', async (reason) => {
        if (isDone) return;
        isDone = true;
        this.logger.warn(`Cliente desconectado para ${userId}: ${reason}`);
        await this.whatsappRepo.update({ usuario: { id: userId } }, { estado: 'Desconectado' });
        this.clients.delete(userId);
        cleanup(client);
      });

      client.initialize().catch(err => {
        if (isDone) return;
        isDone = true;
        clearTimeout(timeout);
        cleanup(client);
        this.logger.error(`Error al inicializar sesión para ${userId}: ${err.message}`);
        reject(new InternalServerErrorException('No se pudo inicializar la sesión de WhatsApp.'));
      });
    });
  }

  private createOrRestartSession(userId: string) {
    if (this.clients.has(userId)) return;

    const client = new Client({
      authStrategy: new LocalAuth({ clientId: userId, dataPath: './.wwebjs_auth' }),
      puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] },
    });

    client.on('ready', () => {
      this.logger.log(`Sesión reconectada para ${userId}`);
      this.clients.set(userId, client);
      client.on('message', msg => this.handleIncomingMessage(userId, msg));
    });

    client.on('disconnected', async (reason) => {
      this.logger.warn(`Cliente desconectado para ${userId}: ${reason}`);
      await this.whatsappRepo.update({ usuario: { id: userId } }, { estado: 'Desconectado' });
      this.clients.delete(userId);
      client.destroy();
    });

    client.initialize().catch(err => {
      this.logger.error(`Fallo al reiniciar sesión ${userId}: ${err.message}. Eliminando sesión corrupta.`);
      this.desconectarNumeroPorUserId(userId);
    });
  }

  private async handleIncomingMessage(userId: string, msg: Message) {
    this.logger.log(`Mensaje recibido para ${userId} de ${msg.from}: ${msg.body}`);
  }

  async getConversations(sellerId: string) {
    const client = this.clients.get(sellerId);
    if (!client || (await client.getState()) !== 'CONNECTED') {
      throw new NotFoundException(`Vendedor ${sellerId} no tiene una sesión de WhatsApp activa.`);
    }

    const chats = await client.getChats();
    return chats
      .filter(c => !c.isGroup && c.lastMessage)
      .map(chat => ({
        id: chat.id._serialized,
        nombre_cliente: chat.name,
        numero_cliente: chat.id.user,
        ultimo_mensaje: chat.lastMessage.body,
        timestamp: chat.timestamp * 1000,
        mensajes_no_leidos: chat.unreadCount,
      }));
  }

  async getMessagesFromChat(chatId: string) {
    for (const client of this.clients.values()) {
      try {
        if ((await client.getState()) === 'CONNECTED') {
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
        }
      } catch (e) {}
    }
    throw new NotFoundException(`Chat ${chatId} no fue encontrado en sesiones activas.`);
  }
  
  // ✅ NUEVA FUNCIÓN AÑADIDA
  /**
   * Verifica el estado de la conexión de un usuario.
   */
  async getConnectionStatus(userId: string): Promise<{ status: string }> {
    const client = this.clients.get(userId);
    if (client && (await client.getState()) === 'CONNECTED') {
      return { status: 'CONNECTED' };
    }
    return { status: 'PENDING' };
  }

  async obtenerTodaLaFlota() {
    return this.whatsappRepo.find({ relations: ['usuario'] });
  }

   // ✅ AÑADE TODA ESTA FUNCIÓN DENTRO DE LA CLASE
  async sendMessage(sendMessageDto: SendMessageDto) {
    const { numero, mensaje } = sendMessageDto;

    console.log(`Intentando enviar mensaje a ${numero}: "${mensaje}"`);

    // Aquí va la lógica real para enviar el mensaje con tu librería de WhatsApp
    // Por ejemplo: await this.client.sendMessage(numero + '@c.us', mensaje);

    return { success: true, message: 'Mensaje puesto en cola para envío.' };
  }



  async desconectarNumero(id: string) {
    const conexion = await this.whatsappRepo.findOne({ where: { id }, relations: ['usuario'] });
    if (!conexion) throw new NotFoundException(`Conexión con ID ${id} no encontrada`);
    return this.desconectarNumeroPorUserId(conexion.usuario.id, id);
  }

  private async desconectarNumeroPorUserId(userId: string, flotaId?: string) {
    const client = this.clients.get(userId);
    if (client) {
      await client.logout().catch(e => this.logger.error(`Error durante logout para ${userId}: ${e.message}`));
      this.clients.delete(userId);
    }

    const sessionPath = `./.wwebjs_auth/session-${userId}`;
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }
    

    



    if (flotaId) {
        await this.whatsappRepo.delete(flotaId);
    } else {
        await this.whatsappRepo.delete({ usuario: { id: userId } });
    }

    return { message: `Sesión para usuario ${userId} eliminada y conexión borrada.` };
  }
}