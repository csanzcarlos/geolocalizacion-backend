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
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
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

  // ✅ FUNCIÓN 'findByEmail' AÑADIDA
  /**
   * Busca un usuario por su email.
   * Es necesaria para el proceso de autenticación para validar si el usuario existe.
   */
  async findByEmail(email: string): Promise<User | null> { // <-- CAMBIO AQUÍ
  return this.userRepository.findOne({ 
    where: { email },
    select: ['id', 'nombre', 'email', 'rol', 'password_hash'],
  });
}

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    // Usamos la nueva función para encontrar al usuario
    const user = await this.findByEmail(email);

    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordMatching = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { email: user.email, sub: user.id, rol: user.rol };

    // Retornamos el token JWT y los datos básicos del usuario
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nombre: user.nombre,
        rol: user.rol,
      },
    };
  }

  async findAll() {
    return this.userRepository.find({
      where: { status: Not('archivado') },
      select: ['id', 'nombre', 'email', 'rol', 'status', 'fecha_creacion'],
    });
  }
  
  async findOne(id: string) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    const { password_hash, ...result } = user;
    return result;
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
}