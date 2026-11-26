import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO eke nathi extra fields auto ayin karanawa
      transform: true, // Types auto convert karanawa
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server is running on ${port}!`);
}
bootstrap();