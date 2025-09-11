import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Geolocation } from './entities/geolocation.entity';
import { CreateGeolocationDto } from './dto/create-geolocation.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class GeolocationService {
  constructor(
    @InjectRepository(Geolocation)
    private readonly geolocationRepository: Repository<Geolocation>,
  ) {}

  /**
   * Crea o actualiza la ubicación de un vendedor.
   * @param vendorId - El ID del usuario (vendedor).
   * @param dto - Los datos de latitud y longitud.
   * @returns La entidad de geolocalización guardada.
   */
  async updateLocation(vendorId: string, dto: CreateGeolocationDto): Promise<Geolocation> {
    // 1. Buscamos si ya existe una ubicación para este vendedor.
    let location = await this.geolocationRepository.findOne({
      where: { user: { id: vendorId } },
    });

    if (!location) {
      // 2a. Si no existe, creamos una nueva instancia y la vinculamos al usuario.
      location = this.geolocationRepository.create({
        ...dto,
        user: { id: vendorId } as User, // Asignamos la relación por ID.
      });
    } else {
      // 2b. Si ya existe, solo actualizamos las coordenadas.
      location.latitude = dto.latitude;
      location.longitude = dto.longitude;
    }

    // 3. Guardamos los cambios. TypeORM sabe si debe hacer un INSERT (crear) o un UPDATE (actualizar).
    return this.geolocationRepository.save(location);
  }

  /**
   * Encuentra la última ubicación registrada de un vendedor.
   * @param vendorId - El ID del usuario (vendedor).
   * @returns La entidad de geolocalización encontrada.
   */
  async findOneByVendor(vendorId: string): Promise<Geolocation> {
    const location = await this.geolocationRepository.findOne({
        where: { user: { id: vendorId } },
        relations: ['user'], // Opcional: para que también traiga los datos del usuario.
    });

    if (!location) {
        throw new NotFoundException(`No se encontró ubicación para el vendedor con ID ${vendorId}`);
    }
    return location;
  }
}