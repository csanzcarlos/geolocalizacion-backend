import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToOne, 
  JoinColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Importa la entidad User

@Entity()
export class Geolocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Usamos 'decimal' para mayor precisión en las coordenadas
  @Column('decimal', { precision: 10, scale: 7 })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7 })
  longitude: number;

  // Esta columna se actualizará automáticamente con la fecha y hora cada vez que se guarde la ubicación
  @UpdateDateColumn()
  timestamp: Date;

  // --- Relación con el Vendedor (User) ---
  // Un vendedor (User) solo tiene una ubicación en tiempo real.
  @OneToOne(() => User, { onDelete: 'CASCADE' }) // Si se borra el usuario, se borra su ubicación
  @JoinColumn()
  user: User;
}