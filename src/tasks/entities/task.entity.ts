import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
// ✅ CORRECCIÓN: Se actualizó la ruta de importación para que no use la carpeta 'entities'
import { Task } from './task.entity';
import { Client } from '../clients/entities/client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Client])], // Importamos Task y Client
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
