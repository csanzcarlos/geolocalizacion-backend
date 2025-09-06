import { IsNotEmpty, IsUUID } from 'class-validator';

export class AdjudicateClientDto {
  @IsNotEmpty()
  @IsUUID()
  vendedorId: string;
}