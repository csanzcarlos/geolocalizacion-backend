import { IsNotEmpty, IsUUID, IsNumber, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateVisitDto {
  @IsNotEmpty()
  @IsUUID()
  id_cliente: string;

  @IsNotEmpty()
  @IsUUID()
  id_vendedor: string;

  @IsNotEmpty()
  @IsNumber()
  duracion_minutos: number;

  @IsOptional()
  @IsBoolean()
  realizo_cotizacion: boolean;

  @IsOptional()
  @IsBoolean()
  realizo_pedido: boolean;

  @IsOptional()
  @IsString()
  numero_pedido_cotizacion: string;

  @IsOptional()
  @IsString()
  comentarios: string;

   @IsOptional()
  @IsString()
  foto_url: string;
}