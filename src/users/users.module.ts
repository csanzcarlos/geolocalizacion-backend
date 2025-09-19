// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt'; // <-- Importa JwtModule
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    // ✅ Registra JwtModule aquí también
    JwtModule.register({
      secret: 'TU_PALABRA_SECRETA_SUPER_DIFICIL', // 🚨 USA LA MISMA CLAVE SECRETA
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Es importante exportar el servicio
})
export class UsersModule {}