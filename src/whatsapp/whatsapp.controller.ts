// ✅ REEMPLAZA EL CONTENIDO DE TU ARCHIVO CON ESTE CÓDIGO

import { Controller, Post, Body, Get, Delete, Param, NotFoundException } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { ConectarNumeroDto } from './dto/conectar-numero.dto';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  // --- Endpoint para iniciar una nueva conexión y obtener el QR ---
  // El frontend llamará a GET /whatsapp/connect
  @Get('connect')
  async startConnection() {
    try {
      // Llama al servicio para que genere una nueva sesión y devuelva el QR
      const qrCode = await this.whatsappService.startNewSession();
      return { qr: qrCode };
    } catch (error) {
      console.error('Error en el controlador al intentar generar QR:', error);
      throw new NotFoundException('No se pudo generar el código QR en este momento.');
    }
  }
  
  // --- Endpoint para obtener las conversaciones de un VENDEDOR (sesión activa) ---
  // El frontend llamará a GET /whatsapp/conversations/ID_DEL_VENDEDOR
  @Get('conversations/:sellerId')
  async getConversations(@Param('sellerId') sellerId: string) {
    try {
      const conversations = await this.whatsappService.getConversations(sellerId);
      return conversations;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  // --- Endpoint para obtener los mensajes de un CHAT ---
  // El frontend llamará a GET /whatsapp/messages/ID_DEL_CHAT
  @Get('messages/:chatId')
  async getMessages(@Param('chatId') chatId: string) {
    try {
        const messages = await this.whatsappService.getMessagesFromChat(chatId);
        return messages;
    } catch (error) {
        throw new NotFoundException(error.message);
    }
  }


  // --- Tus rutas existentes para manejar la base de datos se mantienen ---
  @Post('flota')
  conectar(@Body() conectarNumeroDto: ConectarNumeroDto) {
    return this.whatsappService.conectarNumero(conectarNumeroDto);
  }

  @Get('flota')
  obtenerFlota() {
    return this.whatsappService.obtenerTodaLaFlota();
  }

  @Delete('flota/:id')
  desconectar(@Param('id') id: string) {
    return this.whatsappService.desconectarNumero(id);
  }
}

