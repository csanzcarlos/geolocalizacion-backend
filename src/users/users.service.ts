async create(createUserDto: CreateUserDto) {
  const { email, nombre, rol, password } = createUserDto;

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = this.userRepository.create({
    email,
    nombre,
    rol,
    password_hash: hashedPassword, // en la DB sigue siendo hash
  });

  await this.userRepository.save(user);

  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

async login(loginUserDto: LoginUserDto) {
  const { email, password } = loginUserDto;
  const user = await this.userRepository.findOneBy({ email });

  if (!user || !user.password_hash) {
    throw new UnauthorizedException('Credenciales inválidas');
  }

  const isPasswordMatching = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordMatching) {
    throw new UnauthorizedException('Credenciales inválidas');
  }

  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
