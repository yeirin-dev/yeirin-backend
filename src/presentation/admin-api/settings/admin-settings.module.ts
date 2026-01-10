import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminCommonModule } from '@yeirin/admin-common';
import { AssessmentSettingsEntity } from '@infrastructure/persistence/typeorm/entity/assessment-settings.entity';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { AdminSettingsController } from './admin-settings.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssessmentSettingsEntity]),
    forwardRef(() => AdminAuthModule),
    AdminCommonModule.register({
      globalGuard: false,
      globalInterceptor: false,
    }),
  ],
  controllers: [AdminSettingsController],
})
export class AdminSettingsModule {}
