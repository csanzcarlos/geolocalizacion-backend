// ✅ PEGA ESTE CÓDIGO EN: src/whatsapp/whatsapp.controller.ts

import { Controller, Post, Body, Get, Delete, Param } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { ConectarNumeroDto } from './dto/conectar-numero.dto';

@Controller('whatsapp') // Todas las rutas aquí empezarán con /whatsapp
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  // --- Endpoint para conectar un número ---
  // Se accederá a través de POST /whatsapp/flota
  @Post('flota')
  conectar(@Body() conectarNumeroDto: ConectarNumeroDto) {
    return this.whatsappService.conectarNumero(conectarNumeroDto);
  }

  // --- Endpoint para obtener toda la flota ---
  // Se accederá a través de GET /whatsapp/flota
  @Get('flota')
  obtenerFlota() {
    return this.whatsappService.obtenerTodaLaFlota();
  }

  // --- Endpoint para desconectar un número ---
  // Se accederá a través de DELETE /whatsapp/flota/ID_A_BORRAR
  @Delete('flota/:id')
  desconectar(@Param('id') id: string) {
    return this.whatsappService.desconectarNumero(id);
  }
}