import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { email, nombre, rol, password_hash } = createUserDto;
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password_hash, salt);
    
    const user = this.userRepository.create({
      email,
      nombre,
      rol,
      password_hash: hashedPassword,
    });
    
    await this.userRepository.save(user);
    // No devolver la contraseña en la respuesta
    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password_hash } = loginUserDto;
    const user = await this.userRepository.findOneBy({ email });

    // Verificación robusta para prevenir errores si el usuario no existe o no tiene contraseña
    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordMatching = await bcrypt.compare(password_hash, user.password_hash);
    
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // No devolver la contraseña en la respuesta
    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll() {
    // Busca todos los usuarios y selecciona solo los campos no sensibles
    return this.userRepository.find({
        select: ['id', 'nombre', 'email', 'rol'] 
    });
  }
}

