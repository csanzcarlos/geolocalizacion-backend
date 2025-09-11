import { 
  Injectable, 
  BadRequestException, 
  ConflictException, 
  UnauthorizedException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password_hash'>> {
    if (!createUserDto.password || createUserDto.password.trim() === '') {
      throw new BadRequestException('El campo de contraseña no puede estar vacío.');
    }
    
    const existingUser = await this.userRepository.findOneBy({ email: createUserDto.email });
    if (existingUser) {
        throw new ConflictException('El correo electrónico ya está en uso.');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    const newUser = this.userRepository.create({
      ...createUserDto,
      password_hash: hashedPassword,
    });

    const savedUser = await this.userRepository.save(newUser);
    
    const { password_hash, ...result } = savedUser;
    return result;
  }

  /**
   * ✅ LÓGICA DE LOGIN CORREGIDA Y MÁS ROBUSTA
   */
  async login(loginUserDto: LoginUserDto): Promise<Omit<User, 'password_hash'>> {
    const { email, password } = loginUserDto;
    const user = await this.userRepository.findOneBy({ email });

    // 1. Verificación robusta: Si el usuario no existe O si existe pero no tiene un hash de contraseña,
    //    se lanza la misma excepción de "credenciales inválidas".
    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Compara la contraseña enviada con el hash guardado.
    const isPasswordMatching = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll(): Promise<Omit<User, 'password_hash'>[]> {
    return this.userRepository.find({
        select: ['id', 'nombre', 'email', 'rol', 'fecha_creacion'] 
    });
  }
}

