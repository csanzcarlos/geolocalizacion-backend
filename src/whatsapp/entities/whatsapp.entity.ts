// ✅ PEGA ESTE CÓDIGO EN: src/whatsapp/entities/whatsapp.entity.ts

import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    OneToOne, 
    JoinColumn 
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('whatsapp_flota') // Este será el nombre de la tabla en la base de datos
export class WhatsappFlota {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    nombre_agente: string;

    @Column({ unique: true })
    numero_whatsapp: string;

    @Column()
    estado: string; // Ej: "Conectado", "Desconectado"

    // --- Esta es la relación clave ---
    // Un registro de WhatsappFlota pertenece a un solo Usuario.
    @OneToOne(() => User)
    @JoinColumn({ name: 'usuario_id' }) // Esto crea la columna "usuario_id" que nos conecta a la tabla User.
    usuario: User;
}