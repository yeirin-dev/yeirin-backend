import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewEntity } from '@infrastructure/persistence/typeorm/entity/review.entity';
import { ReviewRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/review.repository.impl';
import { CreateReviewUseCase } from '@application/review/use-case/create-review.usecase';
import { UpdateReviewUseCase } from '@application/review/use-case/update-review.usecase';
import { GetReviewUseCase } from '@application/review/use-case/get-review.usecase';
import { GetReviewsUseCase } from '@application/review/use-case/get-reviews.usecase';
import { DeleteReviewUseCase } from '@application/review/use-case/delete-review.usecase';
import { IncrementHelpfulUseCase } from '@application/review/use-case/increment-helpful.usecase';
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
    GetReviewUseCase,
    GetReviewsUseCase,
    DeleteReviewUseCase,
    IncrementHelpfulUseCase,
  ],
  exports: ['ReviewRepository'],
})
export class ReviewModule {}
