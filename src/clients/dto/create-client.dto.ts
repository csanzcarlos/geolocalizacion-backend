import { IsNotEmpty, IsString, IsNumber, IsUUID } from 'class-validator';

export class CreateClientDto {
  @IsNotEmpty()
  @IsString()
  identificador_cliente: string;

  @IsNotEmpty()
  @IsString()
  nombre_negocio: string;

  @IsNotEmpty()
  @IsString()
  direccion: string;

  @IsNotEmpty()
  @IsString()
  telefono: string; // <-- Nuevo campo 'telefono'

  @IsNotEmpty()
  @IsNumber()
  latitud: number;

  @IsNotEmpty()
  @IsNumber()
  longitud: number;

  @IsUUID()
  vendedor_id: string;
}