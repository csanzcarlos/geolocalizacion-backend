import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';

@Entity({ name: 'visitas' })
export class Visit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'id_cliente' })
  cliente: Client;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'id_vendedor' })
  vendedor: User;

  @CreateDateColumn()
  fecha_visita: Date;

  @Column('decimal')
  duracion_minutos: number;

  @Column({ default: false })
  realizo_cotizacion: boolean;

  @Column({ default: false })
  realizo_pedido: boolean;

  @Column({ nullable: true })
  numero_pedido_cotizacion: string;

  @Column({ type: 'text', nullable: true })
  comentarios: string;
}