import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common'; // ✅ LÍNEA CORREGIDA
import { WhatsappService } from './whatsapp.service';
import { SendMessageDto } from './dto/send-message.dto'; // Asegúrate que la ruta a tu DTO es correcta

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('connect/:userId')
  generarQr(@Param('userId') userId: string) {
    return this.whatsappService.generarQrParaUsuario(userId);
  }

  // Ahora esta función es válida porque @Post y @Body están importados
  @Post('send-message')
  sendMessage(@Body() sendMessageDto: SendMessageDto) {
    return this.whatsappService.sendMessage(sendMessageDto);
  }

  @Get('status/:userId')
  getConnectionStatus(@Param('userId') userId: string) {
    return this.whatsappService.getConnectionStatus(userId);
  }

  @Get('flota')
  obtenerFlota() {
    return this.whatsappService.obtenerTodaLaFlota();
  }

  @Delete('flota/:id')
  desconectar(@Param('id') id: string) {
    return this.whatsappService.desconectarNumero(id);
  }

  @Get('conversations/:sellerId')
  getConversations(@Param('sellerId') sellerId: string) {
    return this.whatsappService.getConversations(sellerId);
  }

  @Get('messages/:chatId')
  getMessages(@Param('chatId') chatId: string) {
    return this.whatsappService.getMessagesFromChat(chatId);
  }
}