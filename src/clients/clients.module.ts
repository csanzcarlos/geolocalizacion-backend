import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { User } from '../users/entities/user.entity';
import { Visit } from '../visits/entities/visit.entity'; // <-- Importa la entidad de visita

@Module({
  imports: [
    TypeOrmModule.forFeature([Client, User, Visit]) // <-- Agrega la entidad de visita
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}