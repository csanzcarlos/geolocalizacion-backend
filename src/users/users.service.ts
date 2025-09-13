import { 
  Injectable, 
  BadRequestException, 
  ConflictException, 
  UnauthorizedException,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

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

  async findAll() {
    return this.userRepository.find({
      where: { status: Not('archivado') },
      select: ['id', 'nombre', 'email', 'rol', 'status', 'fecha_creacion'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.preload({
      id: id,
      ...updateUserDto,
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    if (updateUserDto.password) {
      const saltRounds = 10;
      user.password_hash = await bcrypt.hash(updateUserDto.password, saltRounds);
    }

    await this.userRepository.save(user);
    const { password_hash, ...result } = user;
    return result;
  }

  async remove(id: string) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    user.status = 'archivado';
    await this.userRepository.save(user);
    return { message: `Usuario ${user.nombre} archivado exitosamente.` };
  }

  async findAllArchived() {
    return this.userRepository.find({
      where: { status: 'archivado' },
      select: ['id', 'nombre', 'email', 'rol', 'status', 'fecha_creacion'],
    });
  }
  
  /**
   * ✅ LÓGICA DE LOGIN CORREGIDA Y MÁS ROBUSTA
   */
  async login(loginUserDto: LoginUserDto): Promise<Omit<User, 'password_hash'>> {
    const { email, password } = loginUserDto;
    const user = await this.userRepository.findOneBy({ email });

    // 1. Verificación robusta: Si el usuario no existe O si existe pero no tiene un hash de contraseña,
    //    se lanza la misma excepción de \"credenciales inválidas\".
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
}

