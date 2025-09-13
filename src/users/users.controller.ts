import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'; // ✅ IMPORTA MÁS MÓDULOS
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto'; // ✅ IMPORTA EL DTO DE ACTUALIZACIÓN

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.usersService.login(loginUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // ✅ NUEVO MÉTODO PARA ACTUALIZAR (LO NECESITARÁS)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

   @Get('archivados/all')
  findAllArchived() {
    return this.usersService.findAllArchived();
  }


  // ✅ NUEVO MÉTODO PARA ARCHIVAR
  // Esta es la "puerta" que le faltaba a tu API.
  // Se activa cuando el frontend pide archivar un usuario.
  @Delete(':id')
  remove(@Param('id') id: string) {
    // Llama a la función 'remove' del servicio, que en realidad archiva.
    return this.usersService.remove(id);
  }
}