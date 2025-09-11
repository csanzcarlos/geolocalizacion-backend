import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío.' })
  nombre: string;

  @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido.' })
  email: string;

  // ✅ CORRECCIÓN: El campo se llama 'password', no 'password_hash'.
  @IsString()
  @MinLength(4, { message: 'La contraseña debe tener al menos 4 caracteres.' })
  password: string;

  @IsString()
  @IsNotEmpty()
  rol: string;
}

