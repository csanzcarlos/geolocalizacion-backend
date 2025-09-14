// src/empresa/empresa.controller.ts
import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Put, 
    Param,
    // ✅ CORRECCIÓN: Se añaden las importaciones que faltaban
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator
} from '@nestjs/common';
// ✅ CORRECCIÓN: Se importa FileInterceptor desde el lugar correcto
import { FileInterceptor } from '@nestjs/platform-express';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Post()
  create(@Body() createEmpresaDto: CreateEmpresaDto) {
    return this.empresaService.create(createEmpresaDto);
  }

  @Post('logo')
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }), // 2MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|gif)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    // ✅ CORRECCIÓN: Se llama al método correcto 'updateLogo' en el servicio
    return this.empresaService.updateLogo(file);
  }

  @Get()
  findOne() {
    return this.empresaService.findOne();
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateEmpresaDto: UpdateEmpresaDto) {
    return this.empresaService.update(id, updateEmpresaDto);
  }
}