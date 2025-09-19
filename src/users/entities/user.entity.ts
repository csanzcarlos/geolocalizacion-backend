import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Geolocation } from '../../geolocation/entities/geolocation.entity';
import { WhatsappFlota } from '../../whatsapp/entities/whatsapp-flota.entity'; // ✅ Importa tu entidad de WhatsApp

@Entity({ name: 'usuarios' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column()
  nombre: string;

  @Column()
  rol: string;

  @Column({ default: 'activo' })
  status: string;

  @CreateDateColumn()
  fecha_creacion: Date;

  @Column({ type: 'varchar', nullable: true, select: false })
  resetPasswordToken: string;

  @Column({ type: 'timestamp', nullable: true, select: false })
  resetPasswordExpires: Date;

  @OneToOne(() => Geolocation, (geolocation) => geolocation.user)
  @JoinColumn()
  geolocation: Geolocation;

  // ✅ Añade la relación de WhatsApp aquí
  @OneToOne(() => WhatsappFlota, (whatsapp) => whatsapp.usuario)
  whatsapp: WhatsappFlota;
}