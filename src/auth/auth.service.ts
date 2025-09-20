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

 async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    
    // CORREGIDO: Se usa user.password_hash, que es como se llama en tu base de datos.
    if (user && await bcrypt.compare(pass, user.password_hash)) {
      const { password_hash, ...result } = user; // <-- CORREGIDO
      return result;
    }
    
    return null;
  }


async login(user: any) {
  const payload = { username: user.email, sub: user.id, rol: user.rol };
  return {
    access_token: this.jwtService.sign(payload),
    user: user // <-- ✅ AÑADE ESTA LÍNEA
  };
}
}