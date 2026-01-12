import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { createWinstonLogger } from '@infrastructure/logging/winston.config';
import { AppModule } from './app.module';

// 🇰🇷 한국 시간대 설정 (KST, UTC+9)
// 모든 날짜/시간 연산이 한국 시간 기준으로 동작하도록 설정
process.env.TZ = 'Asia/Seoul';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: createWinstonLogger(),
  });
  const logger = new Logger('Bootstrap');

  // 보안 헤더 설정 (Helmet)
  // 개발/비프로덕션 환경(HTTP)에서는 보안 헤더 완화
  const isProduction = process.env.NODE_ENV === 'production';
  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
              imgSrc: ["'self'", 'data:', 'https:'],
            },
          }
        : false, // 비프로덕션 환경에서는 CSP 비활성화
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false, // Swagger UI 호환성을 위해 비활성화
      crossOriginResourcePolicy: false, // Swagger UI 호환성을 위해 비활성화
      originAgentCluster: false,
      hsts: isProduction, // HTTP 환경에서 HSTS 비활성화
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
      'http://localhost:3003', // yeirin-admin 프론트엔드
      // EC2 서버 (Yeirin, Soul-E, Yeirin-AI)
      'http://43.201.184.103:3000',
      'http://3.34.93.211:8000',
      'http://15.165.26.121:8001',
      // Vercel 배포 (yeirin-admin)
      'https://yeirin-admin.vercel.app',
      /\.vercel\.app$/,
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
    // 일반 API 태그
    .addTag('인증', '사용자 인증/인가 및 회원가입 API')
    .addTag('아동 관리', '보호자의 아동 등록 및 조회 API')
    .addTag('상담의뢰지', '상담의뢰지 생성, 조회, 매칭 및 상태 관리 API')
    .addTag('상담사 관리', '상담사 프로필 생성, 조회, 수정, 삭제 API')
    .addTag('바우처 기관', '바우처 공급기관 관리 API')
    .addTag('상담 매칭', 'AI 기반 상담기관 추천 API')
    .addTag('리뷰', '바우처 기관 리뷰 작성 및 관리 API')
    // Admin API 태그
    .addTag('Admin - 대시보드', '관리자 대시보드 API (ADMIN 전용)')
    .addTag('Admin - 사용자 관리', '사용자 조회, 정지, 활성화 관리 API (ADMIN 전용)')
    .addTag('Admin - 상담의뢰 관리', '상담의뢰 조회, 상태 변경 API (ADMIN 전용)')
    .addTag('Admin - 기관 관리', '기관 활성화/비활성화 관리 API (ADMIN 전용)')
    .addTag('Admin - 통계', '사용자, 상담의뢰, 기관 통계 API (ADMIN 전용)')
    .addTag('Admin - 감사 로그', '관리자 활동 감사 로그 조회 API (ADMIN 전용)')
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
