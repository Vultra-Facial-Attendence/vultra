import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import type { Environment } from './core/environment.js';

const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
  { bufferLogs: true },
);
app.useLogger(app.get(Logger));

const document = SwaggerModule.createDocument(
  app,
  new DocumentBuilder().setTitle('Vultra API').build(),
);
SwaggerModule.setup('docs', app, document, { jsonDocumentUrl: 'docs/json' });

const config = app.get<ConfigService<Environment, true>>(ConfigService);
await app.listen(
  config.get('API_PORT', { infer: true }),
  config.get('API_HOST', { infer: true }),
);
