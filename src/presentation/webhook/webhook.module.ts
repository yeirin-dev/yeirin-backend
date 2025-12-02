import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UpdatePsychologicalStatusUseCase } from '@application/webhook/use-cases/update-psychological-status/update-psychological-status.use-case';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';
import { PsychologicalStatusLogEntity } from '@infrastructure/persistence/typeorm/entity/psychological-status-log.entity';
import { ChildRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/child.repository.impl';
import { WebhookController } from './webhook.controller';

/**
 * Webhook Module
 *
 * Soul-E 챗봇 등 외부 서비스에서 호출하는 Webhook API를 제공합니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PsychologicalStatusLogEntity, ChildProfileEntity])],
  controllers: [WebhookController],
  providers: [
    UpdatePsychologicalStatusUseCase,
    {
      provide: 'ChildRepository',
      useClass: ChildRepositoryImpl,
    },
  ],
})
export class WebhookModule {}
