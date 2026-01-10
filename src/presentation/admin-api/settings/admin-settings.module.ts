import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminCommonModule } from '@shared/admin-common';
import { AssessmentSettingsEntity } from '@infrastructure/persistence/typeorm/entity/assessment-settings.entity';
import { AdminSettingsController } from './admin-settings.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssessmentSettingsEntity]),
    AdminCommonModule.register({
      globalGuard: false,
      globalInterceptor: false,
    }),
  ],
  controllers: [AdminSettingsController],
})
export class AdminSettingsModule {}
