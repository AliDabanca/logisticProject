import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS'u aktif ediyoruz
  app.enableCors({
    origin: '*', // Veya 'http://localhost:3002' (React portun)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(3001);
  console.log('Ingestion Service 3001 portunda hazır! 🚀');
}
bootstrap();