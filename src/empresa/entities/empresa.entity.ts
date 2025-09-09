import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'empresa' })
export class Empresa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  rnc: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono: string;

  @Column({ type: 'text', nullable: true })
  direccion: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  correo: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  logoUrl: string; // URL a la imagen del logo
}
