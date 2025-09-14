import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { AdjudicateClientDto } from './dto/adjudicate-client.dto';
import { UpdateClientDto } from './dto/update-client.dto'; // ✅ NUEVO: Importa el DTO de actualización
import { User } from '../users/entities/user.entity';
import { Visit } from '../visits/entities/visit.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Visit)
    private readonly visitRepository: Repository<Visit>,
  ) {}

  async create(createClientDto: CreateClientDto) {
    const { vendedor_id, ...clientData } = createClientDto;
    const vendedor = await this.userRepository.findOneBy({ id: vendedor_id });
    
    if (!vendedor) {
      throw new NotFoundException(`Vendedor con ID ${vendedor_id} no encontrado`);
    }

    const newClient = this.clientRepository.create({
      ...clientData,
      vendedor,
    });

    return this.clientRepository.save(newClient);
  }

  // ✅ NUEVO: Método para actualizar un cliente
  async update(id: string, updateClientDto: UpdateClientDto) {
    const client = await this.clientRepository.preload({
      id,
      ...updateClientDto,
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return this.clientRepository.save(client);
  }

  // ✅ NUEVO: Método para archivar un cliente (soft delete)
  async archive(id: string) {
    const client = await this.clientRepository.findOneBy({ id });
    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }
    client.archivado = true;
    return this.clientRepository.save(client);
  }

  async adjudicate(id: string, adjudicateClientDto: AdjudicateClientDto) {
    const { vendedorId } = adjudicateClientDto;

    const cliente = await this.clientRepository.findOne({
      where: { id },
      relations: ['vendedor'],
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (cliente.vendedor) {
      throw new BadRequestException('Este cliente ya ha sido adjudicado.');
    }
    
    const vendedor = await this.userRepository.findOneBy({ id: vendedorId });
    if (!vendedor) {
      throw new NotFoundException(`Vendedor con ID ${vendedorId} no encontrado`);
    }

    cliente.vendedor = vendedor;
    return this.clientRepository.save(cliente);
  }

  async marcarVisitado(id: string) {
    const cliente = await this.clientRepository.findOneBy({ id });
    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }
    return { success: true, message: 'Visita registrada' };
  }

  async reassign(id: string, adjudicateClientDto: AdjudicateClientDto) {
    const { vendedorId } = adjudicateClientDto;

    const cliente = await this.clientRepository.findOneBy({ id });
    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const vendedor = await this.userRepository.findOneBy({ id: vendedorId });
    if (!vendedor) {
      throw new NotFoundException(`Vendedor con ID ${vendedorId} no encontrado`);
    }

    cliente.vendedor = vendedor;
    return this.clientRepository.save(cliente);
  }

  async findOne(id: string) {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['vendedor'],
    });

    if (!client) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }
    return client;
  }

  // ✅ FUNCIÓN 'findAll' MODIFICADA
  async findAll(vendedorId?: string, includeArchived: boolean = false) {
    const queryOptions: any = {
      relations: ['vendedor'],
      where: { archivado: includeArchived }, // ✅ FILTRAR CLIENTES NO ARCHIVADOS POR DEFECTO
    };

    if (vendedorId) {
      queryOptions.where.vendedor = { id: vendedorId };
    }

    const clientes = await this.clientRepository.find(queryOptions);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    const visitasDeHoy = await this.visitRepository.find({
      where: {
        fecha_visita: Between(hoy, mañana),
      },
      relations: ['cliente'],
    });

    const idsVisitados = new Set(visitasDeHoy.map(v => v.cliente.id));

    return clientes.map(c => ({
      ...c,
      visitado: idsVisitados.has(c.id),
    }));
  }
}