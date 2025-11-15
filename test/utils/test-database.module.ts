import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * 테스트 전용 데이터베이스 모듈
 * 각 테스트 스위트마다 독립적인 데이터베이스 연결 제공
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5433),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'yeirin_test'),
        entities: [__dirname + '/../../src/**/*.entity{.ts,.js}'],
        synchronize: true, // 테스트에서만 true
        dropSchema: true, // 각 테스트 전 스키마 초기화
        logging: false,
      }),
    }),
  ],
})
export class TestDatabaseModule {}
