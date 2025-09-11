import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  email: string;

  // ✅ CORRECCIÓN: El campo se llama 'password' para que coincida con el servicio.
  @IsString()
  @IsNotEmpty()
  password: string;
}

