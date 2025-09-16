import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { Geolocation } from '../../geolocation/entities/geolocation.entity';
import { OneToOne } from 'typeorm';

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

  
  // ...otras columnas como @Column() nombre: string;

@Column({ type: 'varchar', nullable: true, select: false })
resetPasswordToken: string;

@Column({ type: 'timestamp', nullable: true, select: false })
resetPasswordExpires: Date;

@OneToOne(() => Geolocation, (geolocation) => geolocation.user)
  geolocation: Geolocation;
}


