import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from './entities/task.entity';
import { Client } from '../clients/entities/client.entity';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const { clientIds, ...taskData } = createTaskDto;
    
    const newTask = this.taskRepository.create(taskData);

    if (createTaskDto.applyTo === 'specific' && clientIds && clientIds.length > 0) {
      const clients = await this.clientRepository.findBy({ id: In(clientIds) });
      if (clients.length !== clientIds.length) {
        throw new NotFoundException('Uno o más clientes especificados no fueron encontrados.');
      }
      newTask.clients = clients;
    }

    return this.taskRepository.save(newTask);
  }

  async findAll(): Promise<Task[]> {
    return this.taskRepository.find({ relations: ['clients'] });
  }
}
