import { Controller, Get, Param, Delete } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  /**
   * Inicia la conexión y genera un QR para un usuario específico.
   */
  @Get('connect/:userId')
  generarQr(@Param('userId') userId: string) {
    return this.whatsappService.generarQrParaUsuario(userId);
  }

 @Post('send-message')
  sendMessage(@Body() sendMessageDto: SendMessageDto) {
    return this.whatsappService.sendMessage(sendMessageDto);
  }

  // ✅ NUEVO ENDPOINT AÑADIDO
  /**
   * Verifica el estado de la conexión de un usuario.
   * Usado por el frontend para saber cuándo se completó el escaneo del QR.
   */
  @Get('status/:userId')
  getConnectionStatus(@Param('userId') userId: string) {
    return this.whatsappService.getConnectionStatus(userId);
  }


  /**
   * Obtiene la lista de todos los agentes conectados a WhatsApp.
   */
  @Get('flota')
  obtenerFlota() {
    return this.whatsappService.obtenerTodaLaFlota();
  }

  /**
   * Desconecta un número de la flota y elimina su sesión.
   */
  @Delete('flota/:id')
  desconectar(@Param('id') id: string) {
    return this.whatsappService.desconectarNumero(id);
  }

  /**
   * Obtiene las conversaciones de un vendedor específico que esté conectado.
   */
  @Get('conversations/:sellerId')
  getConversations(@Param('sellerId') sellerId: string) {
    return this.whatsappService.getConversations(sellerId);
  }

  /**
   * Obtiene los mensajes de un chat (conversación) específico.
   */
  @Get('messages/:chatId')
  getMessages(@Param('chatId') chatId: string) {
    return this.whatsappService.getMessagesFromChat(chatId);
  }
}