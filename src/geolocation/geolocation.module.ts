import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeolocationService } from './geolocation.service';
import { GeolocationController } from './geolocation.controller';
import { Geolocation } from './entities/geolocation.entity';
import { User } from '../users/entities/user.entity'; // ✅ Asegúrate de importar User

@Module({
  // ✅ Añade 'User' a este array
  imports: [TypeOrmModule.forFeature([Geolocation, User])], 
  controllers: [GeolocationController],
  providers: [GeolocationService],
})
export class GeolocationModule {}