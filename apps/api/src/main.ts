import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import type { Environment } from '@core/config/environment.js';
import { setUpApp } from '@core/setup.js';

const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
  { bufferLogs: true },
);
app.useLogger(app.get(Logger));
setUpApp(app);

const config = app.get<ConfigService<Environment, true>>(ConfigService);
await app.listen(
  config.get('API_PORT', { infer: true }),
  config.get('API_HOST', { infer: true }),
);
