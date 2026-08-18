import sdk from './observability/tracer';

sdk.start();

import multipart from '@fastify/multipart';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import packageJson from '../../package.json';
import { AppModule } from './app.module';
import { EnvService } from './env/env.service';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { log } from './logger';

process.on('unhandledRejection', (reason) => {
  log.error(reason, '[Unhandled Rejection]');
});

process.on('uncaughtException', (err) => {
  log.error(err, '[Uncaught Exception]');
});

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ loggerInstance: log })
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const envService = app.get(EnvService);

  const port = envService.get('PORT');

  app.setGlobalPrefix('api');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "'data:'", "'https:'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedOrigins = envService.get('CORS_ORIGIN')?.split(',') || ['*'];

      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'), origin);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  const config = new DocumentBuilder()
    .setTitle('Fast Feet API')
    .setDescription(
      'A robust package delivery management system built with NestJS, following Domain-Driven Design (DDD) and Clean Architecture principles.'
    )
    .setVersion(packageJson.version)
    .addTag('Health', 'Kubernetes liveness, readiness and startup probes')
    .addTag('Admins', 'Admin person management endpoints')
    .addTag('Packages', 'Package management endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });

  await app
    .listen(port ?? 3333, '0.0.0.0')
    .then(() => {
      log.info(`🚀  API running on port ${port}`);
      log.info(
        `📚  Swagger documentation: <http://localhost:${port}/api/docs>`
      );
    })
    .catch((err) => log.error(err));
}
bootstrap();
