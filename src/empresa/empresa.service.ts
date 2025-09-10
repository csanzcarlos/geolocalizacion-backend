import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from './entities/empresa.entity';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

@Injectable()
export class EmpresaService {
  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) {}

  async create(createEmpresaDto: CreateEmpresaDto) {
    // Lógica para asegurar que solo exista un perfil de empresa
    const existingEmpresa = await this.empresaRepository.find();
    if (existingEmpresa.length > 0) {
      throw new ConflictException('El perfil de la empresa ya existe y no se puede crear otro.');
    }
    const newEmpresa = this.empresaRepository.create(createEmpresaDto);
    return this.empresaRepository.save(newEmpresa);
  }

  async findOne() {
    // Siempre busca el primer (y único) perfil de empresa
    const empresa = await this.empresaRepository.findOne({ where: {} });
    if (!empresa) {
      throw new NotFoundException('No se ha configurado el perfil de la empresa.');
    }
    return empresa;
  }

  async update(id: string, updateEmpresaDto: UpdateEmpresaDto) {
    // Carga los datos existentes y los fusiona con los nuevos
    const empresa = await this.empresaRepository.preload({
      id: id,
      ...updateEmpresaDto,
    });
    if (!empresa) {
      throw new NotFoundException(`No se encontró el perfil de la empresa con el ID "${id}"`);
    }
    // Guarda los datos actualizados
    return this.empresaRepository.save(empresa);
  }
}

