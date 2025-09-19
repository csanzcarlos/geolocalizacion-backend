// ✅ Archivo: src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Importación de Módulos de la Aplicación
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { VisitsModule } from './visits/visits.module';
import { EmpresaModule } from './empresa/empresa.module';
import { GeolocationModule } from './geolocation/geolocation.module';
import { TasksModule } from './tasks/tasks.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { AuthModule } from './auth/auth.module'; // ✅ 1. IMPORTAR EL NUEVO AuthModule

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // ✅ REEMPLAZA TU BLOQUE TypeOrmModule.forRoot CON ESTE
    TypeOrmModule.forRoot(
      // Condición para elegir la configuración de la base de datos
      process.env.NODE_ENV === 'production'
        ? // --- CONFIGURACIÓN PARA PRODUCCIÓN (NUBE) ---
          {
            type: 'postgres',
            url: process.env.DATABASE_URL, // Usa la URL completa de Render
            ssl: {
              rejectUnauthorized: false, // Requerido para Render
            },
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: false, // ¡Importante! Nunca uses synchronize:true en producción
          }
        : // --- CONFIGURACIÓN PARA DESARROLLO (LOCAL) ---
          {
            type: 'postgres',
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432', 10),
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            ssl: false, // Desactiva SSL explícitamente para local
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
             // Ideal para desarrollo, considera usar migraciones para producción
          },
    ),

    // Módulos de la aplicación
    UsersModule,
    ClientsModule,
    VisitsModule,
    EmpresaModule,
    GeolocationModule,
    TasksModule,
    WhatsappModule,
    AuthModule, // ✅ 3. AÑADIR AuthModule A LA LISTA DE IMPORTS
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }