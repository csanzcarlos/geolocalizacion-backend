import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ ESTA LÍNEA SOLUCIONA EL ERROR DE CORS
  app.enableCors(); 

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
