import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChildConsentEntity } from '@infrastructure/persistence/typeorm/entity/child-consent.entity';
import { ConsentHistoryEntity } from '@infrastructure/persistence/typeorm/entity/consent-history.entity';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { AdminConsentController } from './admin-consent.controller';

/**
 * Admin Consent Module
 * 동의 관리 Admin API
 *
 * @route /admin/consents
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChildConsentEntity,
      ConsentHistoryEntity,
      ChildProfileEntity,
    ]),
    forwardRef(() => AdminAuthModule),
  ],
  controllers: [AdminConsentController],
  providers: [],
})
export class AdminConsentModule {}
