import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication, Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: 'http://localhost:3000', credentials: true });
  initializeSwagger(app);
  app.use(cookieParser());
  await app.listen(8080);
}

bootstrap();

function initializeSwagger(app: INestApplication) {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TokenVerify')
    .setDescription(
      'decomm is an API that provides information regarding the current holding status of accounts and NFTs',
    )
    .setVersion('1.0')
    .addServer('http://localhost:8080')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/documentation', app, swaggerDocument);
  Logger.log(
    'API documentation is running on http://localhost:8080/documentation',
  );
}
