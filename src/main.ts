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
  // 개발 환경(HTTP)에서는 HTTPS 강제 헤더 비활성화
  const isDev = process.env.NODE_ENV === 'development';
  app.use(
    helmet({
      contentSecurityPolicy: isDev
        ? false // 개발 환경에서는 CSP 비활성화
        : {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
              imgSrc: ["'self'", 'data:', 'https:'],
            },
          },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: isDev ? false : { policy: 'same-origin' },
      crossOriginResourcePolicy: isDev ? false : { policy: 'same-origin' },
      originAgentCluster: isDev ? false : true,
      hsts: isDev ? false : true, // HTTP 환경에서 HSTS 비활성화
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
      'http://13.124.149.80:3000',
      'http://13.124.149.80:3001',
      'http://13.124.149.80:3002',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Swagger 설정
  const host = process.env.HOST || 'localhost';
  const port = process.env.PORT || 3000;
  const serverUrl = `http://${host}:${port}`;
  const serverDesc = host === 'localhost' ? 'Local Development' : 'Development Server';

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
    .addServer(serverUrl, serverDesc)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(port);

  logger.log(`🚀 Yeirin 백엔드 서버가 포트 ${port}에서 시작되었습니다`);
  logger.log(`📍 API: ${serverUrl}/api/v1`);
  logger.log(`📚 Swagger: ${serverUrl}/api`);
}

bootstrap();
