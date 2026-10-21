import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setUpApp(app: NestFastifyApplication) {
  app.enableCsrfProtection();
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().setTitle('Vultra API').build(),
  );
  SwaggerModule.setup('docs', app, document, { jsonDocumentUrl: 'docs/json' });
}
