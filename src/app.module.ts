import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { VisitsModule } from './visits/visits.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL, // ✅ Render la inyecta automáticamente
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false }  // 🔐 Render requiere SSL
        : false,                         // 🚀 En local no uses SSL
      autoLoadEntities: true,
      synchronize: true, // ⚠️ Solo usar en desarrollo (en producción mejor migrations)
    }),
    UsersModule,
    ClientsModule,
    VisitsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
