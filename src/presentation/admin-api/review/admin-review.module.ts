import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewEntity } from '@infrastructure/persistence/typeorm/entity/review.entity';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { AdminReviewController } from './admin-review.controller';

/**
 * Admin Review Module
 * 리뷰 관리 Admin API
 *
 * @route /admin/reviews
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewEntity]),
    forwardRef(() => AdminAuthModule),
  ],
  controllers: [AdminReviewController],
  providers: [],
})
export class AdminReviewModule {}
