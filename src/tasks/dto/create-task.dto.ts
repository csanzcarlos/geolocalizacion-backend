import { IsString, IsNotEmpty, IsInt, Min, IsIn, IsArray, IsOptional, IsUUID } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la tarea no puede estar vacío.' })
  name: string;

  @IsInt()
  @Min(1)
  visitCount: number;

  @IsIn(['monthly', 'weekly'])
  frequency: 'monthly' | 'weekly';

  @IsIn(['all', 'specific'])
  applyTo: 'all' | 'specific';

  // Es opcional y solo se envía cuando applyTo es 'specific'
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Cada ID de cliente debe ser un UUID válido.' })
  clientIds?: string[];
}
