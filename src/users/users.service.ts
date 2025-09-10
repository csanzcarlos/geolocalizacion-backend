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
    // La lógica de creación parece estar bien, encriptando la contraseña.
    const { username, nombre, rol, password } = createUserDto;
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = this.userRepository.create({
      username, // Asumiendo que el DTO y la entidad usan 'username' para el correo
      nombre,
      rol,
      password: hashedPassword, // Asumiendo que la entidad usa 'password'
    });
    await this.userRepository.save(user);
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(loginUserDto: LoginUserDto) {
    const { username, password } = loginUserDto;
    const user = await this.userRepository.findOneBy({ username });

    // ✅ CORRECCIÓN: Se añade una verificación para asegurar que el usuario
    // no solo exista, sino que también tenga una contraseña guardada.
    // Esto previene el error "data and hash arguments required".
    if (!user || !user.password) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordMatching = await bcrypt.compare(password, user.password);
    
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Función para obtener todos los usuarios (útil para el panel)
  async findAll() {
    return this.userRepository.find({
        select: ['id', 'nombre', 'username', 'rol', 'telefono'] // No devolver contraseñas
    });
  }
}
