// ARCHIVO A CORREGIR: src/empresa/empresa.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empresa } from './entities/empresa.entity';
import { EmpresaController } from './empresa.controller';
import { EmpresaService } from './empresa.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module'; // 1. Asegúrate de que esta línea exista

@Module({
  imports: [
    TypeOrmModule.forFeature([Empresa]),
    CloudinaryModule // 2. ✅ ¡ESTA ES LA LÍNEA CLAVE QUE PROBABLEMENTE FALTA!
  ],
  controllers: [EmpresaController],
  providers: [EmpresaService],
})
export class EmpresaModule {}