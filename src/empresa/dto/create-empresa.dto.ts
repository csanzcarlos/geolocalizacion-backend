import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CreateEmpresaDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la empresa no puede estar vacío.' })
  nombre: string;

  @IsString()
  @IsOptional()
  rnc?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  correo?: string;

  @IsString()
  @IsUrl({}, { message: 'La URL del logo no es válida.' })
  @IsOptional()
  logoUrl?: string;
}

