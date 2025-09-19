// src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'TU_PALABRA_SECRETA_SUPER_DIFICIL', // 🚨 USA LA MISMA CLAVE SECRETA
    });
  }

  async validate(payload: any) {
    // El token ya fue validado, aquí devolvemos los datos que queremos adjuntar al objeto request
    return { userId: payload.sub, username: payload.username, rol: payload.rol };
  }
}