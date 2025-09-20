// src/data-source.ts
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config(); // Carga las variables de tu archivo .env

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',

  // ✅ Usamos la URL de conexión directamente de tu archivo .env
  url: process.env.DATABASE_URL,

  // ✅ Añadimos configuración SSL necesaria para conectar con Render
  ssl: {
    rejectUnauthorized: false,
  },

  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false, // ¡Muy importante que sea false!
};

const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;