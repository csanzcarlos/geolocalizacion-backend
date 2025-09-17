// ✅ REEMPLAZA EL CONTENIDO DE TU ARCHIVO CON ESTE CÓDIGO CORREGIDO

import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
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
    private readonly whatsappRepository: Repository<WhatsappFlota>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    this.logger.log('Reiniciando sesiones de WhatsApp existentes...');
    const flota = await this.obtenerTodaLaFlota();
    for (const agente of flota) {
      if (agente.usuario) {
        this.logger.log(`Intentando reiniciar sesión para ${agente.nombre_agente} (ID: ${agente.usuario.id})`);
        this.createSession(agente.usuario.id);
      }
    }
  }

  startNewSession(): Promise<string> {
    if (this.isGeneratingQR) {
      this.logger.warn('Ya hay un proceso de generación de QR en curso.');
      return Promise.reject(new Error('Ya se está generando un código QR. Por favor, espera.'));
    }
    
    this.isGeneratingQR = true;

    return new Promise((resolve, reject) => {
      const tempClientId = `session-temp-${Date.now()}`;
      this.logger.log(`Creando cliente temporal con ID: ${tempClientId}`);
      
      const client = new Client({
        authStrategy: new LocalAuth({ clientId: tempClientId, dataPath: './.wwebjs_auth' }),
        puppeteer: { 
          headless: true,
          // CAMBIO CLAVE: Argumentos optimizados para entornos con pocos recursos como Render
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // <- Este es muy importante en entornos con poca RAM
            '--disable-gpu'
          ] 
        },
      });

      const timeout = setTimeout(() => {
        this.logger.error('Timeout: El QR no se generó en 45 segundos.');
        client.destroy().catch(e => this.logger.error('Error al destruir cliente en timeout', e));
        this.isGeneratingQR = false;
        reject(new Error('Timeout al generar el QR. Inténtalo de nuevo.'));
      }, 45000); // Aumentamos el timeout a 45 segundos por si acaso

      client.once('qr', (qr) => {
        clearTimeout(timeout);
        this.logger.log('QR RECIBIDO, generando Data URL...');
        qrcode.toDataURL(qr, (err, url) => {
          this.isGeneratingQR = false;
          if (err) {
            this.logger.error('Error al convertir QR a Data URL:', err);
            reject(new Error('Error al generar el Data URL del QR'));
          } else {
            resolve(url);
          }
          client.destroy().catch(e => this.logger.error('Error al destruir cliente temporal tras QR', e));
        });
      });

      client.once('ready', () => {
        this.logger.log(`Cliente temporal ${tempClientId} conectado. Se autodestruirá.`);
        clearTimeout(timeout);
        this.isGeneratingQR = false;
        client.destroy().catch(e => this.logger.error('Error al destruir cliente temporal en "ready"', e));
        reject(new Error('El teléfono ya está conectado. No se necesita escanear.'));
      });
      
      client.once('auth_failure', (msg) => {
        this.logger.error('Fallo de autenticación temporal:', msg);
        clearTimeout(timeout);
        this.isGeneratingQR = false;
        reject(new Error('Fallo de autenticación.'));
      });

      client.initialize().catch(err => {
        clearTimeout(timeout);
        this.logger.error(`Error al inicializar cliente temporal:`, err);
        this.isGeneratingQR = false;
        reject(new Error(`Error al inicializar cliente: ${err.message}`));
      });
    });
  }

  private createSession(userId: string) {
    if (this.clients.has(userId)) {
      this.logger.log(`La sesión para el usuario ${userId} ya existe o se está iniciando.`);
      return;
    }
    this.logger.log(`Creando nueva sesión para el usuario ${userId}.`);
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: userId, dataPath: './.wwebjs_auth' }),
        puppeteer: { 
            headless: true,
             // CAMBIO CLAVE: Argumentos optimizados también para las sesiones persistentes
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        },
    });

    client.on('ready', () => {
        this.logger.log(`Sesión para el usuario ${userId} está lista y conectada.`);
        this.clients.set(userId, client);
    });
    
    client.on('disconnected', async (reason) => {
        this.logger.log(`Usuario ${userId} desconectado por: ${reason}. Eliminando sesión.`);
        client.destroy().catch(e => this.logger.error('Error al destruir cliente en "disconnected"', e));
        this.clients.delete(userId);
    });

    client.initialize().catch(error => {
        this.logger.error(`No se pudo inicializar la sesión para ${userId}:`, error.message);
    });
  }
  
  // ... (El resto de las funciones se mantienen igual) ...

  async getConversations(sellerId: string): Promise<any[]> {
    const client = this.clients.get(sellerId);
    if (!client || (await client.getState()) !== 'CONNECTED') {
      throw new NotFoundException(`El vendedor con ID ${sellerId} no tiene una sesión de WhatsApp activa o conectada.`);
    }

    const chats = await client.getChats();
    const formattedChats = await Promise.all(
        chats.filter(chat => !chat.isGroup && chat.lastMessage).map(async chat => {
            return {
                id: chat.id._serialized,
                nombre_cliente: chat.name,
                numero_cliente: chat.id.user,
                ultimo_mensaje: chat.lastMessage?.body || '',
                timestamp: chat.timestamp * 1000,
                mensajes_no_leidos: chat.unreadCount,
            };
        })
    );
    return formattedChats.sort((a, b) => b.timestamp - a.timestamp);
  }

  async getMessagesFromChat(chatId: string): Promise<any[]> {
    for (const client of this.clients.values()) {
        try {
            const chat = await client.getChatById(chatId);
            if(chat) {
                const messages = await chat.fetchMessages({ limit: 50 });
                return messages.map(msg => ({
                    id: msg.id._serialized,
                    cuerpo: msg.body,
                    timestamp: msg.timestamp * 1000,
                    es_del_cliente: !msg.fromMe
                }));
            }
        } catch (e) { /* El chat no está en este cliente, se ignora y continúa la búsqueda */ }
    }
    throw new NotFoundException(`Chat con ID ${chatId} no encontrado en ninguna sesión activa.`);
  }

  async conectarNumero(dto: ConectarNumeroDto): Promise<WhatsappFlota> {
    const usuario = await this.userRepository.findOneBy({ id: dto.usuario_id });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${dto.usuario_id} no encontrado.`);
    }
    const nuevaConexion = this.whatsappRepository.create({
      ...dto,
      usuario,
      estado: 'Iniciando',
    });
    const savedConnection = await this.whatsappRepository.save(nuevaConexion);
    this.createSession(dto.usuario_id); 
    return savedConnection;
  }

  async obtenerTodaLaFlota(): Promise<WhatsappFlota[]> {
    return this.whatsappRepository.find({ relations: ['usuario'] });
  }

  async desconectarNumero(id: string): Promise<{ message: string }> {
    const conexion = await this.whatsappRepository.findOne({ where: { id }, relations: ['usuario'] });
    if (!conexion) {
        throw new NotFoundException(`Conexión con ID "${id}" no encontrada.`);
    }
    
    const client = this.clients.get(conexion.usuario.id);
    if (client) {
        await client.destroy();
        this.clients.delete(conexion.usuario.id);
    }
    
    const sessionPath = `./.wwebjs_auth/session-${conexion.usuario.id}`;
    if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        this.logger.log(`Carpeta de sesión eliminada: ${sessionPath}`);
    }

    await this.whatsappRepository.delete(id);
    return { message: `La conexión ha sido eliminada y la sesión cerrada.` };
  }
}

