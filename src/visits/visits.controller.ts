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

  // ✅ Endpoint unificado y corregido. Esta es la ÚNICA ruta GET principal.
  @Get()
  findAll(
    @Query('clienteId') clienteId?: string,
    @Query('vendedorId') vendedorId?: string,
  ) {
    // Si la URL es /visits?clienteId=123, se ejecuta esto:
    if (clienteId) {
      // Asumimos que tu servicio tiene un método llamado 'findAllByClientId'
      return this.visitsService.findAllByClientId(clienteId);
    }
    // Si la URL es /visits?vendedorId=456, se ejecuta esto:
    if (vendedorId) {
      // Asumimos que tu servicio tiene un método llamado 'findAllByVendedorId'
      return this.visitsService.findAllByVendedorId(vendedorId);
    }
    // Si la URL es solo /visits, se ejecuta esto:
    return this.visitsService.findAll();
  }

  @Get('today')
  findAllToday() {
    return this.visitsService.findAllToday();
  }
  
  // ❌ SE ELIMINÓ LA RUTA DUPLICADA (@Get('cliente/:clientId'))
  //    La lógica ya está cubierta en el @Get() principal de arriba.

  @Get('history')
  async findAllByDateRange(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.visitsService.findAllByDateRange(fromDate, toDate);
  }
}