// ✅ ESTE ARCHIVO ESTÁ CORRECTO, NO ES NECESARIO HACER CAMBIOS
import { Controller, Get, Param, Post, Body, Delete, InternalServerErrorException } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { ConectarNumeroDto } from './dto/conectar-numero.dto';

@Controller('whatsapp')
export class WhatsappController {
 constructor(private readonly whatsappService: WhatsappService) {}

 @Get('connect')
 async startConnection() {
  try {
   const qr = await this.whatsappService.startNewSession();
   return { qr };
  } catch (error) {
   throw new InternalServerErrorException(error.message);
  }
 }

 @Get('conversations/:sellerId')
 getConversations(@Param('sellerId') sellerId: string) {
  return this.whatsappService.getConversations(sellerId);
 }

 @Get('messages/:chatId')
 getMessages(@Param('chatId') chatId: string) {
  return this.whatsappService.getMessagesFromChat(chatId);
 }

 @Post('flota')
 conectar(@Body() dto: ConectarNumeroDto) {
  return this.whatsappService.conectarNumero(dto);
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