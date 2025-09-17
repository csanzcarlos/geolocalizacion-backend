import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('whatsapp_flota')
export class WhatsappFlota {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre_agente: string;

  @Column({ unique: true })
  numero_whatsapp: string;

  @Column()
  estado: string; // Ej: "Conectado", "Desconectado"

  @OneToOne(() => User)
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @Column({ default: 300 }) // Tiempo en segundos para alerta de mensaje sin responder
  alerta_timeout: number;
}
