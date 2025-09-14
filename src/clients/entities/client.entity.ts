import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'clientes' })
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  identificador_cliente: string;

  @Column()
  nombre_negocio: string;

  @Column()
  direccion: string;

  @Column()
  telefono: string;

  @Column('decimal', { precision: 10, scale: 7 })
  latitud: number;

  @Column('decimal', { precision: 10, scale: 7 })
  longitud: number;

  // ✅ NUEVO: Campo para el archivado (soft delete)
  @Column({ default: false })
  archivado: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'vendedor_id' })
  vendedor: User;
}