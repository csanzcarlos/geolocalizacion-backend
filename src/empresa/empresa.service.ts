// ======================================================
//      ARCHIVO CORREGIDO: src/empresa/empresa.service.ts
// ======================================================

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from './entities/empresa.entity';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
// 1. ✅ IMPORTA EL SERVICIO DE CLOUDINARY
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class EmpresaService {
  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    // 2. ✅ INYECTA EL SERVICIO DE CLOUDINARY PARA PODER USARLO
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // 3. ✅ ESTE ES EL MÉTODO CORRECTO PARA MANEJAR LA SUBIDA DEL LOGO
  //    Recibe el archivo completo desde el controlador.
  async updateLogo(file: Express.Multer.File) {
    // Primero, busca el perfil de la empresa que ya debe existir
    const empresa = await this.findOne();
    if (!empresa) {
      throw new NotFoundException('Primero debe crear el perfil de la empresa antes de subir un logo.');
    }

    try {
      // Usa el servicio de Cloudinary para subir el archivo
      const uploadResult = await this.cloudinaryService.uploadFile(file);
      
      // Cloudinary nos devuelve una URL segura (https)
      const secureUrl = uploadResult.secure_url;

      // Actualiza el campo logoUrl de la empresa con la nueva URL
      empresa.logoUrl = secureUrl;
      
      // Guarda los cambios en la base de datos
      await this.empresaRepository.save(empresa);

      return { message: 'Logo actualizado con éxito', logoUrl: secureUrl };
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      throw new ConflictException('No se pudo subir la imagen a Cloudinary.');
    }
  }
  
  async create(createEmpresaDto: CreateEmpresaDto) {
    const existingEmpresa = await this.empresaRepository.find();
    if (existingEmpresa.length > 0) {
      throw new ConflictException('El perfil de la empresa ya existe y no se puede crear otro.');
    }
    const newEmpresa = this.empresaRepository.create(createEmpresaDto);
    return this.empresaRepository.save(newEmpresa);
  }

  async findOne() {
    const empresa = await this.empresaRepository.findOne({ where: {} });
    if (!empresa) {
      throw new NotFoundException('No se ha configurado el perfil de la empresa.');
    }
    return empresa;
  }

  async update(id: string, updateEmpresaDto: UpdateEmpresaDto) {
    const empresa = await this.empresaRepository.preload({
      id: id,
      ...updateEmpresaDto,
    });
    if (!empresa) {
      throw new NotFoundException(`No se encontró el perfil de la empresa con el ID "${id}"`);
    }
    return this.empresaRepository.save(empresa);
  }
}