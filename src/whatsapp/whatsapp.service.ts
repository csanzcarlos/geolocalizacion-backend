// ✅ REEMPLAZA EL CONTENIDO DE TU ARCHIVO CON ESTE CÓDIGO

import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsappFlota } from './entities/whatsapp.entity';
import { User } from '../users/entities/user.entity';
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';
import { ConectarNumeroDto } from './dto/conectar-numero.dto';
import * as fs from 'fs';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private clients = new Map<string, Client>();
  // --> NUEVO: Flag para evitar que se generen múltiples QRs a la vez
  private isGeneratingQR = false;

  constructor(
    @InjectRepository(WhatsappFlota)
    private readonly whatsappRepository: Repository<WhatsappFlota>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    console.log('Reiniciando sesiones de WhatsApp existentes...');
    const flota = await this.obtenerTodaLaFlota();
    for (const agente of flota) {
      if (agente.usuario) {
        console.log(`Intentando reiniciar sesión para ${agente.nombre_agente} (ID: ${agente.usuario.id})`);
        this.createSession(agente.usuario.id);
      }
    }
  }

  startNewSession(): Promise<string> {
    // --> NUEVO: Si ya se está generando un QR, rechazamos la nueva petición
    if (this.isGeneratingQR) {
        console.log('Ya hay un proceso de generación de QR en curso.');
        return Promise.reject(new Error('Ya se está generando un código QR. Por favor, espera.'));
    }
    
    this.isGeneratingQR = true; // Bloqueamos nuevas peticiones

    return new Promise((resolve, reject) => {
      const tempClientId = `session-${Date.now()}`;
      console.log(`Creando cliente temporal con ID: ${tempClientId}`);
      
      const client = new Client({
        authStrategy: new LocalAuth({ clientId: tempClientId, dataPath: './.wwebjs_auth' }),
        puppeteer: { 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions'] 
        },
      });

      const timeout = setTimeout(() => {
        console.error('Timeout: El QR no se generó en 30 segundos.');
        client.destroy();
        this.isGeneratingQR = false;
        reject('Timeout al generar el QR. Inténtalo de nuevo.');
      }, 30000); // Timeout de 30 segundos

      client.on('qr', (qr) => {
        clearTimeout(timeout); // Cancelamos el timeout porque el QR llegó
        console.log('QR RECIBIDO, generando Data URL...');
        qrcode.toDataURL(qr, (err, url) => {
          if (err) {
            console.error('Error al convertir QR a Data URL:', err);
            this.isGeneratingQR = false;
            reject('Error al generar el Data URL del QR');
          }
          resolve(url);
        });
      });

      client.on('ready', () => {
        console.log(`Cliente temporal ${tempClientId} conectado. Se autodestruirá.`);
        clearTimeout(timeout);
        client.destroy(); // Destruimos el cliente una vez conectado
        this.isGeneratingQR = false;
        // Aquí deberías tener un webhook o socket para notificar al frontend que se escaneó
        // y ahora se debe asociar a un usuario.
      });
      
      client.on('auth_failure', (msg) => {
        console.error('Fallo de autenticación temporal:', msg);
        clearTimeout(timeout);
        this.isGeneratingQR = false;
        reject('Fallo de autenticación.');
      });

      client.initialize().catch(err => {
        clearTimeout(timeout);
        console.error(`Error al inicializar cliente temporal:`, err);
        this.isGeneratingQR = false;
        reject(`Error al inicializar cliente: ${err.message}`);
      });

    }).finally(() => {
        // --> NUEVO: Nos aseguramos de desbloquear el flag al finalizar
        this.isGeneratingQR = false;
    });
  }

  private createSession(userId: string) {
    if (this.clients.has(userId)) {
      console.log(`La sesión para el usuario ${userId} ya está iniciada.`);
      return;
    }
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: userId, dataPath: './.wwebjs_auth' }),
        puppeteer: { 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--single-process', '--disable-gpu']
        },
    });

    client.on('ready', () => {
        console.log(`Sesión para el usuario ${userId} está lista y conectada.`);
        this.clients.set(userId, client);
    });
    
    client.on('disconnected', async (reason) => {
        console.log(`Usuario ${userId} desconectado por: ${reason}. Eliminando sesión.`);
        this.clients.delete(userId);
        // Opcional: podrías intentar reconectar aquí o limpiar la carpeta de sesión
        const sessionPath = `./.wwebjs_auth/session-${userId}`;
        if (fs.existsSync(sessionPath)) {
            // fs.rmSync(sessionPath, { recursive: true, force: true });
        }
    });

    client.initialize().catch(error => {
        console.error(`No se pudo inicializar la sesión para ${userId}:`, error.message);
    });
  }
  
  // --- El resto de tus funciones se mantienen igual ---
  
  async getConversations(sellerId: string): Promise<any[]> {
    const client = this.clients.get(sellerId);
    if (!client) {
      throw new NotFoundException(`El vendedor con ID ${sellerId} no tiene una sesión de WhatsApp activa.`);
    }

    const chats = await client.getChats();
    const formattedChats = await Promise.all(
        chats.filter(chat => !chat.isGroup).map(async chat => {
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
    return formattedChats;
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
    this.createSession(dto.usuario_id); 
    return this.whatsappRepository.save(nuevaConexion);
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
        await client.destroy(); // Usamos destroy para una limpieza más profunda
        this.clients.delete(conexion.usuario.id);
    }
    
    // Limpiamos la carpeta de la sesión para evitar problemas al reconectar
    const sessionPath = `./.wwebjs_auth/session-${conexion.usuario.id}`;
    if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        console.log(`Carpeta de sesión eliminada: ${sessionPath}`);
    }

    await this.whatsappRepository.delete(id);
    return { message: `La conexión ha sido eliminada y la sesión cerrada.` };
  }
}

