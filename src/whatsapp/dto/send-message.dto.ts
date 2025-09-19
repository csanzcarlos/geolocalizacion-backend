// src/whatsapp/dto/send-message.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  numero: string;

  @IsString()
  @IsNotEmpty()
  mensaje: string;
  
  @IsString() // ✅ AÑADE ESTA PROPIEDAD
  @IsNotEmpty()
  vendedorId: string;
}