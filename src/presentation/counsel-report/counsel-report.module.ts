import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CreateCounselReportUseCase,
  UpdateCounselReportUseCase,
  SubmitCounselReportUseCase,
  GetCounselReportUseCase,
  GetCounselReportsByRequestUseCase,
  ReviewCounselReportUseCase,
  ApproveCounselReportUseCase,
} from '@application/counsel-report/use-cases';
import { CounselReportEntity } from '@infrastructure/persistence/typeorm/entity/counsel-report.entity';
import { CounselReportRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/counsel-report.repository.impl';
import { CounselReportController } from './counsel-report.controller';

/**
 * CounselReport Module
 *
 * @description
 * 면담결과지 모듈 - DDD 계층 통합
 * Domain → Application → Infrastructure → Presentation
 */
@Module({
  imports: [TypeOrmModule.forFeature([CounselReportEntity])],
  controllers: [CounselReportController],
  providers: [
    // Repository Implementation
    {
      provide: 'CounselReportRepository',
      useClass: CounselReportRepositoryImpl,
    },

    // Use Cases
    CreateCounselReportUseCase,
    UpdateCounselReportUseCase,
    SubmitCounselReportUseCase,
    GetCounselReportUseCase,
    GetCounselReportsByRequestUseCase,
    ReviewCounselReportUseCase,
    ApproveCounselReportUseCase,
  ],
  exports: [
    'CounselReportRepository',
    CreateCounselReportUseCase,
    GetCounselReportUseCase,
    GetCounselReportsByRequestUseCase,
  ],
})
export class CounselReportModule {}
