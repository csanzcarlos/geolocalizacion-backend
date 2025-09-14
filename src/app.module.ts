import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // <-- 1. Importa el ConfigModule
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { VisitsModule } from './visits/visits.module';
import { EmpresaModule } from './empresa/empresa.module';
import { GeolocationModule } from './geolocation/geolocation.module';




@Module({
  imports: [
    // 2. Añade ConfigModule.forRoot() al principio de los imports.
    // Esto cargará las variables de entorno (como las de Render) en tu aplicación.
    ConfigModule.forRoot({
      isGlobal: true, // Hace que las variables estén disponibles en toda la app
    }),
    
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL, // ✅ Ahora esta línea funcionará
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

