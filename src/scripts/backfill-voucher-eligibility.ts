/**
 * 바우처 추천대상 여부 백필 스크립트
 *
 * 기존 상담의뢰지에 바우처 추천대상 여부를 계산하여 저장합니다.
 *
 * 실행 방법:
 * cd backend/yeirin
 * npx ts-node -r tsconfig-paths/register src/scripts/backfill-voucher-eligibility.ts
 *
 * 또는
 * yarn ts-node -r tsconfig-paths/register src/scripts/backfill-voucher-eligibility.ts
 */

import { NestFactory } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module, Logger } from '@nestjs/common';
import { IsNull, Repository } from 'typeorm';
import { getTypeOrmConfig } from '@infrastructure/config/typeorm.config';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { SoulEClient } from '@infrastructure/external/soul-e.client';
import { CheckVoucherEligibilityUseCase } from '@application/child/use-cases/check-voucher-eligibility/check-voucher-eligibility.use-case';

// 배치 처리 설정
const BATCH_SIZE = 50; // 한 번에 처리할 개수
const DELAY_MS = 100; // 각 요청 사이 딜레이 (ms)
const DRY_RUN = process.argv.includes('--dry-run'); // 실제 업데이트 없이 시뮬레이션

// 스크립트 전용 모듈
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => getTypeOrmConfig(configService),
    }),
    TypeOrmModule.forFeature([CounselRequestEntity]),
  ],
  providers: [SoulEClient, CheckVoucherEligibilityUseCase],
})
class BackfillModule {}

// 딜레이 함수
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 진행 상황 로깅
function logProgress(current: number, total: number, logger: Logger) {
  const percentage = Math.round((current / total) * 100);
  const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
  logger.log(`[${progressBar}] ${percentage}% (${current}/${total})`);
}

async function bootstrap() {
  const logger = new Logger('BackfillVoucherEligibility');

  logger.log('====================================');
  logger.log('바우처 추천대상 여부 백필 스크립트 시작');
  logger.log(`모드: ${DRY_RUN ? 'DRY RUN (시뮬레이션)' : 'LIVE (실제 업데이트)'}`);
  logger.log('====================================');

  // NestJS 애플리케이션 부트스트랩
  const app = await NestFactory.createApplicationContext(BackfillModule, {
    logger: ['error', 'warn', 'log'],
  });

  const counselRequestRepository = app.get<Repository<CounselRequestEntity>>(
    'CounselRequestEntityRepository',
  );
  const checkVoucherEligibilityUseCase = app.get(CheckVoucherEligibilityUseCase);

  try {
    // 바우처 추천대상 여부가 아직 계산되지 않은 상담의뢰지 조회
    const counselRequests = await counselRequestRepository.find({
      where: {
        isVoucherEligible: IsNull(),
      },
      select: ['id', 'childId', 'createdAt'],
      order: { createdAt: 'ASC' },
    });

    const total = counselRequests.length;
    logger.log(`처리 대상 상담의뢰지: ${total}개`);

    if (total === 0) {
      logger.log('처리할 상담의뢰지가 없습니다.');
      await app.close();
      return;
    }

    // 통계 초기화
    const stats = {
      processed: 0,
      eligible: 0,
      notEligible: 0,
      noAssessment: 0,
      errors: 0,
    };

    // 배치 처리
    for (let i = 0; i < total; i++) {
      const counselRequest = counselRequests[i];

      try {
        // 바우처 추천대상 여부 계산
        const eligibilityResult = await checkVoucherEligibilityUseCase.execute(
          counselRequest.childId,
        );

        if (!eligibilityResult.hasAllRequiredAssessments) {
          // 검사 결과가 없는 경우
          stats.noAssessment++;
          logger.debug(
            `[${i + 1}/${total}] ID: ${counselRequest.id} - 검사 결과 없음 (childId: ${counselRequest.childId})`,
          );
        } else if (eligibilityResult.isEligible) {
          stats.eligible++;
          logger.log(
            `[${i + 1}/${total}] ID: ${counselRequest.id} - 바우처 추천대상 ✓ (사유: ${eligibilityResult.eligibilityReasons?.join(', ')})`,
          );
        } else {
          stats.notEligible++;
          logger.debug(
            `[${i + 1}/${total}] ID: ${counselRequest.id} - 바우처 추천대상 아님`,
          );
        }

        // 실제 업데이트 (DRY_RUN이 아닌 경우)
        if (!DRY_RUN) {
          await counselRequestRepository.update(counselRequest.id, {
            isVoucherEligible: eligibilityResult.isEligible,
            voucherEligibilityReasons: eligibilityResult.eligibilityReasons || [],
            voucherEligibilityCheckedAt: new Date(),
          });
        }

        stats.processed++;
      } catch (error) {
        stats.errors++;
        logger.error(
          `[${i + 1}/${total}] ID: ${counselRequest.id} - 에러 발생: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // 진행 상황 로깅 (10개마다)
      if ((i + 1) % 10 === 0 || i + 1 === total) {
        logProgress(i + 1, total, logger);
      }

      // Rate limiting
      if (i < total - 1) {
        await delay(DELAY_MS);
      }
    }

    // 최종 통계 출력
    logger.log('====================================');
    logger.log('백필 완료 통계');
    logger.log('====================================');
    logger.log(`총 처리: ${stats.processed}`);
    logger.log(`바우처 추천대상: ${stats.eligible}`);
    logger.log(`바우처 추천대상 아님: ${stats.notEligible}`);
    logger.log(`검사 결과 없음: ${stats.noAssessment}`);
    logger.log(`에러: ${stats.errors}`);
    logger.log('====================================');

    if (DRY_RUN) {
      logger.warn('DRY RUN 모드로 실행되어 실제 데이터베이스는 변경되지 않았습니다.');
      logger.warn('실제 업데이트를 하려면 --dry-run 옵션 없이 실행하세요.');
    }
  } catch (error) {
    logger.error('백필 스크립트 실행 중 치명적 에러 발생:', error);
  } finally {
    await app.close();
    logger.log('스크립트 종료');
  }
}

// 스크립트 실행
bootstrap().catch((error) => {
  console.error('Bootstrap failed:', error);
  process.exit(1);
});
