// src/visits/visits.controller.ts

import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';

@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  create(@Body() createVisitDto: CreateVisitDto) {
    return this.visitsService.create(createVisitDto);
  }

  // ✅ Endpoint unificado para filtrar por cliente o vendedor
  @Get()
  findAll(
    @Query('clienteId') clienteId?: string,
    @Query('vendedorId') vendedorId?: string,
  ) {
    if (clienteId) {
      return this.visitsService.findAllByClientId(clienteId);
    }
    if (vendedorId) {
      return this.visitsService.findAllByVendedorId(vendedorId);
    }
    // Si no se proporciona ningún filtro, puedes devolver todas las visitas
    return this.visitsService.findAll();
  }
 @Get('today')
  findAllToday() {
    return this.visitsService.findAllToday();
  }

  @Get('cliente/:clientId')
findAllByClient(@Param('clientId') clientId: string) {
  return this.visitsService.findAllByClient(clientId);
}
  
  // ✅ Este es el endpoint para el historial de visitas con filtro de fecha
  @Get('history')
  async findAllByDateRange(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.visitsService.findAllByDateRange(fromDate, toDate);
  }
}