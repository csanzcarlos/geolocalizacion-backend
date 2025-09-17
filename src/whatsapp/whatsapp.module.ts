// ✅ ESTE ARCHIVO ESTÁ CORRECTO, NO ES NECESARIO HACER CAMBIOS
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappFlota } from './entities/whatsapp.entity';
import { User } from '../users/entities/user.entity';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';

@Module({
 imports: [TypeOrmModule.forFeature([WhatsappFlota, User])],
 providers: [WhatsappService],
 controllers: [WhatsappController],
})
export class WhatsappModule {}