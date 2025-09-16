// ✅ PEGA ESTE CÓDIGO EN: src/whatsapp/whatsapp.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsappFlota } from './entities/whatsapp.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class WhatsappService {
  constructor(
    @InjectRepository(WhatsappFlota)
    private readonly whatsappRepository: Repository<WhatsappFlota>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Conecta un nuevo número de WhatsApp a un usuario.
   * @param dto - Contiene el nombre del agente, el número y el ID del usuario.
   * @returns La nueva entidad de WhatsappFlota creada.
   */
  async conectarNumero(dto: { nombre_agente: string; numero_whatsapp: string; usuario_id: string }): Promise<WhatsappFlota> {
    const { usuario_id, ...data } = dto;

    // Verificamos que el usuario al que se va a asociar el número exista.
    const usuario = await this.userRepository.findOneBy({ id: usuario_id });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuario_id} no encontrado.`);
    }

    // Creamos la nueva conexión de WhatsApp.
    const nuevaConexion = this.whatsappRepository.create({
      ...data,
      usuario: usuario, // Asociamos el objeto de usuario completo.
      estado: 'Conectado', // Por defecto, se conecta.
    });

    return this.whatsappRepository.save(nuevaConexion);
  }

  /**
   * Devuelve todos los números de la flota conectados.
   * @returns Una lista de todas las conexiones de WhatsApp.
   */
  async obtenerTodaLaFlota(): Promise<WhatsappFlota[]> {
    return this.whatsappRepository.find({
      relations: ['usuario'], // Incluimos los datos del usuario asociado.
    });
  }

  /**
   * Desconecta (elimina) un número de la flota.
   * @param id - El ID de la conexión de WhatsappFlota a eliminar.
   */
  async desconectarNumero(id: string): Promise<{ message: string }> {
    const result = await this.whatsappRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Conexión de WhatsApp con ID "${id}" no encontrada.`);
    }
    
    return { message: `La conexión de WhatsApp ha sido eliminada.` };
  }
}