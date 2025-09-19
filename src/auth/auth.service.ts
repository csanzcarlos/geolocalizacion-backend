// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'; // <-- 1. ASEGÚRATE DE IMPORTAR BCRYPT

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // ✅ REEMPLAZA TU FUNCIÓN CON ESTA
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    
    // 2. Compara la contraseña del login (pass) con la guardada (user.password)
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user; // Quita la contraseña del objeto
      return result; // Retorna los datos del usuario si todo es correcto
    }
    
    return null; // Retorna null si el usuario no existe o la contraseña es incorrecta
  }


async login(user: any) {
  const payload = { username: user.email, sub: user.id, rol: user.rol };
  return {
    access_token: this.jwtService.sign(payload),
    user: user // <-- ✅ AÑADE ESTA LÍNEA
  };
}
}