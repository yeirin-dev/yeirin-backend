import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateReviewUseCase } from '@application/review/use-case/create-review/create-review.use-case';
import { DeleteReviewUseCase } from '@application/review/use-case/delete-review/delete-review.use-case';
import { UpdateReviewUseCase } from '@application/review/use-case/update-review/update-review.use-case';
import { ReviewEntity } from '@infrastructure/persistence/typeorm/entity/review.entity';
import { ReviewRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/review.repository';
import { ReviewController } from './review.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ReviewEntity])],
  controllers: [ReviewController],
  providers: [
    // Repository
    {
      provide: 'ReviewRepository',
      useClass: ReviewRepositoryImpl,
    },
    // UseCases
    CreateReviewUseCase,
    UpdateReviewUseCase,
    DeleteReviewUseCase,
  ],
  exports: ['ReviewRepository'],
})
export class ReviewModule {}
