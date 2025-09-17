// ✅ Archivo: src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { VisitsModule } from './visits/visits.module';
import { EmpresaModule } from './empresa/empresa.module';
import { GeolocationModule } from './geolocation/geolocation.module';
import { TasksModule } from './tasks/tasks.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

// ✅ IMPORTACIÓN DE TODAS LAS ENTIDADES
import { User } from './users/entities/user.entity';
import { Client } from './clients/entities/client.entity';
import { Visit } from './visits/entities/visit.entity';
import { Empresa } from './empresa/entities/empresa.entity';
import { Geolocation } from './geolocation/entities/geolocation.entity';
import { Task } from './tasks/entities/task.entity';
import { WhatsappFlota } from './whatsapp/entities/whatsapp.entity';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false }
        : false,
      autoLoadEntities: true,
      synchronize: true,
      // ✅ IMPORTANTE: Se han agregado todas las entidades para que TypeORM las sincronice.
      entities: [
        User,
        Client,
        Visit,
        Empresa,
        Geolocation,
        Task,
        WhatsappFlota
      ],
    }),

    UsersModule,
    ClientsModule,
    VisitsModule,
    EmpresaModule,
    GeolocationModule,
    TasksModule,
    WhatsappModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}