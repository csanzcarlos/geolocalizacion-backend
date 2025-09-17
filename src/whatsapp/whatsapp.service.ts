// ✅ REEMPLAZA EL CONTENIDO DE TU ARCHIVO CON ESTE CÓDIGO

import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsappFlota } from './entities/whatsapp.entity';
import { User } from '../users/entities/user.entity';
import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';
import { ConectarNumeroDto } from './dto/conectar-numero.dto';

@Injectable()
export class WhatsappService implements OnModuleInit {
  // Map para almacenar las sesiones activas de WhatsApp. La clave es el ID del usuario (vendedor).
  private clients = new Map<string, Client>();

  constructor(
    @InjectRepository(WhatsappFlota)
    private readonly whatsappRepository: Repository<WhatsappFlota>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Este método se ejecuta cuando el módulo se inicia.
  // Lo usaremos para reiniciar las sesiones que ya estaban conectadas.
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

  /**
   * Inicia una nueva sesión temporal para generar un QR y que un vendedor se conecte.
   * @returns El código QR en formato Data URL (base64).
   */
  startNewSession(): Promise<string> {
    return new Promise((resolve, reject) => {
      const tempClientId = `session-${Date.now()}`;
      const client = new Client({
        authStrategy: new LocalAuth({ clientId: tempClientId }),
        puppeteer: { 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        },
      });

      client.on('qr', (qr) => {
        console.log('QR generado para nueva sesión.');
        qrcode.toDataURL(qr, (err, url) => {
          if (err) {
            console.error('Error al convertir QR a Data URL:', err);
            reject('Error al generar el Data URL del QR');
          }
          resolve(url);
        });
      });

      client.on('ready', () => {
        console.log(`Cliente temporal ${tempClientId} conectado. Ahora debe ser asociado a un vendedor.`);
        // IMPORTANTE: En un sistema de producción, necesitarías una forma de asociar
        // este `tempClientId` con el `usuario_id` real que se conectó.
      });

      client.initialize().catch(err => {
        console.error(`Error al inicializar cliente temporal:`, err);
        reject(`Error al inicializar cliente: ${err.message}`);
      });
    });
  }

  /**
   * Crea e inicializa una sesión de WhatsApp para un usuario específico.
   * @param userId - El ID del usuario (vendedor) para el cual crear la sesión.
   */
  private createSession(userId: string) {
    if (this.clients.has(userId)) {
      console.log(`La sesión para el usuario ${userId} ya está iniciada.`);
      return;
    }
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: userId }),
        puppeteer: { 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--single-process', '--disable-gpu']
        },
    });

    client.on('ready', () => {
        console.log(`Sesión para el usuario ${userId} está lista y conectada.`);
        this.clients.set(userId, client);
    });
    
    client.on('disconnected', () => {
        console.log(`Usuario ${userId} desconectado. Eliminando sesión.`);
        this.clients.delete(userId);
    });

    client.initialize().catch(error => {
        console.error(`No se pudo inicializar la sesión para ${userId}:`, error.message);
    });
  }

  /**
   * Obtiene las conversaciones de un vendedor a partir de su sesión activa.
   */
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

  /**
   * Obtiene los mensajes de un chat específico, buscando en todas las sesiones activas.
   */
  async getMessagesFromChat(chatId: string): Promise<any[]> {
     for (const client of this.clients.values()) {
        try {
            const chat = await client.getChatById(chatId);
            if(chat) {
                const messages = await chat.fetchMessages({ limit: 50 }); // Obtiene los últimos 50 mensajes
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

  // --- Tus métodos existentes para la base de datos (con pequeñas mejoras) ---
  async conectarNumero(dto: ConectarNumeroDto): Promise<WhatsappFlota> {
    const usuario = await this.userRepository.findOneBy({ id: dto.usuario_id });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${dto.usuario_id} no encontrado.`);
    }
    const nuevaConexion = this.whatsappRepository.create({
      ...dto,
      usuario,
      estado: 'Iniciando', // Cambiamos el estado inicial
    });
    // Iniciar la sesión de WhatsApp para este nuevo número
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
    
    // Lógica para cerrar y eliminar la sesión de WhatsApp activa
    const client = this.clients.get(conexion.usuario.id);
    if (client) {
        await client.logout();
        this.clients.delete(conexion.usuario.id);
    }
    await this.whatsappRepository.delete(id);
    return { message: `La conexión ha sido eliminada.` };
  }
}

