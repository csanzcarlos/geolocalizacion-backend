import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { AdjudicateClientDto } from './dto/adjudicate-client.dto';
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

  // ✅ FUNCIÓN 'findAll' FUSIONADA Y CORREGIDA
  async findAll(vendedorId?: string) {
    // 1. Define las opciones de la consulta.
    const queryOptions: any = {
      relations: ['vendedor'],
      where: {},
    };

    // 2. Si se proporciona un vendedorId, lo añade como condición a la consulta.
    if (vendedorId) {
      queryOptions.where = { vendedor: { id: vendedorId } };
    }

    // 3. Ejecuta la consulta para obtener los clientes (filtrados o todos).
    const clientes = await this.clientRepository.find(queryOptions);

    // --- Lógica para determinar el estado 'visitado' (de tu versión) ---
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

