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
  @CreateDateColumn()
  fecha_creacion: Date;
  
@OneToOne(() => Geolocation, (geolocation) => geolocation.user)
  geolocation: Geolocation;
}
  