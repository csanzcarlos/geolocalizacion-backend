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

  /**
   * ✅ LÓGICA DE CREACIÓN CORREGIDA
   * Crea un nuevo usuario, asegurándose de encriptar la contraseña.
   */
  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password_hash'>> {
    // 1. Se usa `createUserDto.password` (el nombre correcto que debe venir del DTO).
    if (!createUserDto.password || createUserDto.password.trim() === '') {
      throw new BadRequestException('El campo de contraseña no puede estar vacío.');
    }
    
    // 2. Se verifica si el email ya existe para evitar duplicados.
    const existingUser = await this.userRepository.findOneBy({ email: createUserDto.email });
    if (existingUser) {
        throw new ConflictException('El correo electrónico ya está en uso.');
    }

    const saltRounds = 10;
    // 3. Se encripta la contraseña en texto plano recibida en `createUserDto.password`.
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    // 4. Se crea la nueva entidad de usuario, guardando el hash en la columna `password_hash`.
    const newUser = this.userRepository.create({
      ...createUserDto,
      password_hash: hashedPassword,
    });

    const savedUser = await this.userRepository.save(newUser);
    
    // 5. Se devuelve el usuario sin el hash de la contraseña por seguridad.
    const { password_hash, ...result } = savedUser;
    return result;
  }

  /**
   * Autentica a un usuario y devuelve sus datos si las credenciales son válidas.
   */
  async login(loginUserDto: LoginUserDto): Promise<Omit<User, 'password_hash'>> {
    const { email, password } = loginUserDto;
    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Compara la contraseña enviada (`password`) con el hash guardado (`user.password_hash`).
    const isPasswordMatching = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Devuelve una lista de todos los usuarios sin datos sensibles.
   */
  async findAll(): Promise<Omit<User, 'password_hash'>[]> {
    return this.userRepository.find({
        select: ['id', 'nombre', 'email', 'rol', 'fecha_creacion'] 
    });
  }
}

