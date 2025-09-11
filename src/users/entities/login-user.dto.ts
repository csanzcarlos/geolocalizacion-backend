import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  email: string;

  // ✅ CORRECCIÓN: El campo se llama 'password', no 'password_hash'.
  @IsString()
  @IsNotEmpty()
  password: string;
}
