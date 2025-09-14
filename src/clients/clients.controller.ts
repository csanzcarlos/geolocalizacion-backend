import { Controller, Get, Post, Body, Patch, Param, Query, Delete } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { AdjudicateClientDto } from './dto/adjudicate-client.dto';
import { UpdateClientDto } from './dto/update-client.dto'; // ✅ NUEVO: Importa el DTO de actualización

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Patch(':id/adjudicar')
  adjudicate(@Param('id') id: string, @Body() adjudicateClientDto: AdjudicateClientDto) {
    return this.clientsService.adjudicate(id, adjudicateClientDto);
  }

  @Patch(':id/marcar-visitado')
  marcarVisitado(@Param('id') id: string) {
    return this.clientsService.marcarVisitado(id);
  }

  @Patch(':id/reasignar')
  reassign(@Param('id') id: string, @Body() adjudicateClientDto: AdjudicateClientDto) {
    return this.clientsService.reassign(id, adjudicateClientDto);
  }

  // ✅ NUEVO ENDPOINT: para actualizar los datos de un cliente
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(id, updateClientDto);
  }

  // ✅ NUEVO ENDPOINT: para archivar un cliente (soft delete)
  @Delete(':id')
  archive(@Param('id') id: string) {
    return this.clientsService.archive(id);
  }

  @Get()
  findAll(@Query('vendedorId') vendedorId?: string) {
    return this.clientsService.findAll(vendedorId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }
}