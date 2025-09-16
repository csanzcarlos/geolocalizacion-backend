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
import { WhatsappModule } from './whatsapp/whatsapp.module'; // ✅ 1. AÑADIR ESTA LÍNEA

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
    }),
    UsersModule,
    ClientsModule,
    VisitsModule,
    EmpresaModule,
    GeolocationModule,
    TasksModule,
    WhatsappModule, // ✅ 2. AÑADIR ESTA LÍNEA
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}