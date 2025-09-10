import { PartialType } from '@nestjs/mapped-types';
import { CreateEmpresaDto } from './create-empresa.dto';

// UpdateEmpresaDto hereda todas las propiedades de CreateEmpresaDto,
// pero las convierte en opcionales, lo cual es perfecto para las actualizaciones.
export class UpdateEmpresaDto extends PartialType(CreateEmpresaDto) {}

