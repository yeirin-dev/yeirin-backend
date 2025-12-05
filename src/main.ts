import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { createWinstonLogger } from '@infrastructure/logging/winston.config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: createWinstonLogger(),
  });
  const logger = new Logger('Bootstrap');

  // 보안 헤더 설정 (Helmet)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Swagger 사용을 위해 필요
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // Swagger UI를 위해 비활성화
    }),
  );

  // Global Validation Pipe 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS 설정
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Yeirin API')
    .setDescription('Yeirin 상담기관 매칭 플랫폼 API 문서')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('인증', '사용자 인증/인가 및 회원가입 API')
    .addTag('아동 관리', '보호자의 아동 등록 및 조회 API')
    .addTag('상담의뢰지', '상담의뢰지 생성, 조회, 매칭 및 상태 관리 API')
    .addTag('상담사 관리', '상담사 프로필 생성, 조회, 수정, 삭제 API')
    .addTag('바우처 기관', '바우처 공급기관 관리 API')
    .addTag('상담 매칭', 'AI 기반 상담기관 추천 API')
    .addTag('리뷰', '바우처 기관 리뷰 작성 및 관리 API')
    .addServer('http://localhost:3000', 'Local Development')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Yeirin 백엔드 서버가 포트 ${port}에서 시작되었습니다`);
  logger.log(`📍 API: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger: http://localhost:${port}/api`);
}

bootstrap();
