import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';

// UpdateTaskDto hereda todas las propiedades de CreateTaskDto
// y las convierte en opcionales.
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}