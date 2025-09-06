import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { AdjudicateClientDto } from './dto/adjudicate-client.dto';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Patch(':id/adjudicar')
  adjudicate(@Param('id') id: string, @Body() adjudicateClientDto: AdjudicateClientDto) {
    return this.clientsService.adjudicate(id, adjudicateClientDto);
  }
@Patch(':id/marcar-visitado')
marcarVisitado(@Param('id') id: string) {
  return this.clientsService.marcarVisitado(id);
}
  @Get()
  findAll() {
    return this.clientsService.findAll();
  }
}