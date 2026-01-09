import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcceptConsentUseCase } from '@application/consent/use-cases/accept-consent.use-case';
import { GetConsentStatusUseCase } from '@application/consent/use-cases/get-consent-status.use-case';
import { RevokeConsentUseCase } from '@application/consent/use-cases/revoke-consent.use-case';
import { ChildConsentEntity } from '@infrastructure/persistence/typeorm/entity/child-consent.entity';
import { ConsentHistoryEntity } from '@infrastructure/persistence/typeorm/entity/consent-history.entity';
import { ChildConsentRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/child-consent.repository.impl';
import { ConsentController } from './consent.controller';

/**
 * 동의서 관리 모듈
 *
 * Soul-E에서 호출하는 MSA 내부 API 제공
 */
@Module({
  imports: [TypeOrmModule.forFeature([ChildConsentEntity, ConsentHistoryEntity])],
  controllers: [ConsentController],
  providers: [
    // Repository 제공
    {
      provide: 'ChildConsentRepository',
      useClass: ChildConsentRepositoryImpl,
    },
    // Use Cases
    AcceptConsentUseCase,
    GetConsentStatusUseCase,
    RevokeConsentUseCase,
  ],
  exports: ['ChildConsentRepository'],
})
export class ConsentModule {}
