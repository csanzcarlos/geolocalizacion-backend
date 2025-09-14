import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { AdjudicateClientDto } from './dto/adjudicate-client.dto';

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

  // ✅ ENDPOINT PARA OBTENER TODOS LOS CLIENTES (con filtro opcional)
  // Responde a: /clients y /clients?vendedorId=...
  @Get()
  findAll(@Query('vendedorId') vendedorId?: string) {
    return this.clientsService.findAll(vendedorId);
  }

  // ✅ RUTA AÑADIDA: Esta era la que faltaba.
  // Responde a la petición del modal para obtener los detalles de UN solo cliente.
  // URL: /clients/ID_DEL_CLIENTE
  @Get(':id')
  findOne(@Param('id') id: string) {
    // Asumiendo que tienes un método findOne en tu clients.service.ts
    return this.clientsService.findOne(id);
  }
}
