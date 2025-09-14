import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Client } from '../clients/entities/client.entity';

@Entity({ name: 'tasks' })
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  visitCount: number;

  @Column()
  frequency: 'monthly' | 'weekly';

  @Column()
  applyTo: 'all' | 'specific';

  @ManyToMany(() => Client)
  @JoinTable({
    name: 'task_clients_client', // nombre de la tabla intermedia
    joinColumn: {
      name: 'taskId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'clientId',
      referencedColumnName: 'id',
    },
  })
  clients: Client[];
}
