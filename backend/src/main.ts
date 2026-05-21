import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS
  app.enableCors({
    origin: [
      'http://localhost',
      'http://localhost:5173',
      process.env.CORS_ORIGIN || 'http://localhost',
    ],
    credentials: true,
  });

  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
  console.log(`🚀 Backend running on http://${host}:${port}`);
}
bootstrap();
