import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Visit } from './entities/visit.entity';
import { User } from '../users/entities/user.entity';
import { Client } from '../clients/entities/client.entity';
import { CreateVisitDto } from './dto/create-visit.dto';

@Injectable()
export class VisitsService {
    constructor(
        @InjectRepository(Visit)
        private readonly visitRepository: Repository<Visit>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Client)
        private readonly clientRepository: Repository<Client>,
    ) {}

    async create(createVisitDto: CreateVisitDto) {
        const { id_cliente, id_vendedor, foto_url, ...visitData } = createVisitDto;
        const cliente = await this.clientRepository.findOneBy({ id: id_cliente });
        const vendedor = await this.userRepository.findOneBy({ id: id_vendedor });

        if (!cliente) throw new NotFoundException('Cliente no encontrado');
        if (!vendedor) throw new NotFoundException('Vendedor no encontrado');

        const newVisit = this.visitRepository.create({
            ...visitData,
            cliente,
            vendedor,
            foto_url, // ✅ Se añade la foto a la nueva visita
        });
        return this.visitRepository.save(newVisit);
    }

    // ✅ Método para buscar todas las visitas de un cliente
    async findAllByClientId(clientId: string) {
        return this.visitRepository.find({
            where: { cliente: { id: clientId } },
            relations: ['cliente', 'vendedor'],
            order: { fecha_visita: 'DESC' },
        });
    }

    // ✅ Método para buscar todas las visitas de un vendedor
    async findAllByVendedorId(vendedorId: string) {
        return this.visitRepository.find({
            where: { vendedor: { id: vendedorId } },
            relations: ['cliente', 'vendedor'],
            order: { fecha_visita: 'DESC' },
        });
    }

    // ✅ Método para buscar todas las visitas sin filtros
    async findAll() {
        return this.visitRepository.find({
            relations: ['cliente', 'vendedor'],
            order: { fecha_visita: 'DESC' },
        });
    }

    // ✅ Método para buscar visitas por rango de fechas
    async findAllByDateRange(fromDate: string, toDate: string) {
        return this.visitRepository.find({
            where: {
                fecha_visita: Between(new Date(fromDate), new Date(toDate)),
            },
            relations: ['cliente', 'vendedor'],
            order: { fecha_visita: 'DESC' },
        });
    }

 async findAllToday() {
    const today = new Date();
    // ⚠️ Corrección: Convertir las fechas a objetos Date.
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    return this.visitRepository.find({
        where: {
            // ✅ AQUI ESTA LA CLAVE: El operador 'Between' espera objetos Date, no cadenas.
            fecha_visita: Between(startOfDay, endOfDay),
        },
        relations: ['cliente', 'vendedor'],
        order: { fecha_visita: 'DESC' },
    });
}


}
