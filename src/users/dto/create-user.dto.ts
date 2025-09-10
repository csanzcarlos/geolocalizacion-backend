export class CreateUserDto {
  nombre: string;
  email: string;
  password: string; // 👈 aquí debe ser password en texto plano
  rol: string;
}