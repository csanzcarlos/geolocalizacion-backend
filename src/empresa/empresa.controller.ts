import { Controller, Get, Post, Body, Put, Param } from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  // Endpoint para crear el perfil de la empresa (solo si no existe)
  @Post()
  create(@Body() createEmpresaDto: CreateEmpresaDto) {
    return this.empresaService.create(createEmpresaDto);
  }

  // Endpoint para obtener el perfil de la empresa (siempre habrá solo uno)
  @Get()
  findOne() {
    return this.empresaService.findOne();
  }

  // Endpoint para actualizar el perfil de la empresa
  @Put(':id')
  update(@Param('id') id: string, @Body() updateEmpresaDto: UpdateEmpresaDto) {
    return this.empresaService.update(id, updateEmpresaDto);
  }
}
