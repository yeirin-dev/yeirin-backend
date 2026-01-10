import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';
import { ChildConsentEntity } from '@infrastructure/persistence/typeorm/entity/child-consent.entity';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { PsychologicalStatusLogEntity } from '@infrastructure/persistence/typeorm/entity/psychological-status-log.entity';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { AdminChildrenController } from './admin-children.controller';

/**
 * Admin Children Module
 * 아동 관리 Admin API
 *
 * @route /admin/children
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChildProfileEntity,
      ChildConsentEntity,
      CounselRequestEntity,
      PsychologicalStatusLogEntity,
    ]),
    forwardRef(() => AdminAuthModule),
  ],
  controllers: [AdminChildrenController],
  providers: [],
})
export class AdminChildrenModule {}
