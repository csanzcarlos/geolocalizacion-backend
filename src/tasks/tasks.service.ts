import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from './entities/task.entity';
import { Client } from '../clients/entities/client.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto'; // <-- 1. IMPORTAR EL NUEVO DTO

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

  // ✅ 2. AÑADIR MÉTODO PARA ACTUALIZAR (EDITAR)
  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const { clientIds, ...taskData } = updateTaskDto;
    
    const task = await this.taskRepository.preload({
      id,
      ...taskData,
    });

    if (!task) {
      throw new NotFoundException(`Tarea con ID "${id}" no encontrada.`);
    }

    if (updateTaskDto.applyTo === 'specific' && clientIds) {
      if (clientIds.length > 0) {
        const clients = await this.clientRepository.findBy({ id: In(clientIds) });
        if (clients.length !== clientIds.length) {
          throw new NotFoundException('Uno o más clientes especificados para actualizar no fueron encontrados.');
        }
        task.clients = clients;
      } else {
        // Si se envía un array vacío, se eliminan los clientes asociados
        task.clients = [];
      }
    } else if (updateTaskDto.applyTo === 'all') {
      // Si se cambia a "todos los clientes", se eliminan las asociaciones específicas
      task.clients = [];
    }

    return this.taskRepository.save(task);
  }

  // ✅ 3. AÑADIR MÉTODO PARA ELIMINAR
  async remove(id: string): Promise<{ message: string }> {
    const result = await this.taskRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Tarea con ID "${id}" no encontrada.`);
    }
    
    return { message: `Tarea con ID "${id}" ha sido eliminada.` };
  }
}