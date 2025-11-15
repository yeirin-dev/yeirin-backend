import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateReviewDto } from '@application/review/dto/create-review.dto';
import {
  ReviewListResponseDto,
  ReviewResponseDto,
} from '@application/review/dto/review-response.dto';
import { UpdateReviewDto } from '@application/review/dto/update-review.dto';
import { CreateReviewUseCase } from '@application/review/use-case/create-review.usecase';
import { DeleteReviewUseCase } from '@application/review/use-case/delete-review.usecase';
import { GetReviewUseCase } from '@application/review/use-case/get-review.usecase';
import { GetReviewsUseCase } from '@application/review/use-case/get-reviews.usecase';
import { IncrementHelpfulUseCase } from '@application/review/use-case/increment-helpful.usecase';
import { UpdateReviewUseCase } from '@application/review/use-case/update-review.usecase';
import { Public } from '@infrastructure/auth/decorators/public.decorator';

@ApiTags('리뷰')
@Controller('reviews')
@Public() // Review API는 공개 API로 설정
export class ReviewController {
  constructor(
    private readonly createReviewUseCase: CreateReviewUseCase,
    private readonly updateReviewUseCase: UpdateReviewUseCase,
    private readonly getReviewUseCase: GetReviewUseCase,
    private readonly getReviewsUseCase: GetReviewsUseCase,
    private readonly deleteReviewUseCase: DeleteReviewUseCase,
    private readonly incrementHelpfulUseCase: IncrementHelpfulUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: '리뷰 생성' })
  @ApiResponse({ status: 201, description: '리뷰 생성 성공', type: ReviewResponseDto })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async createReview(@Body() dto: CreateReviewDto): Promise<ReviewResponseDto> {
    return await this.createReviewUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: '리뷰 목록 조회' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 개수', example: 10 })
  @ApiResponse({ status: 200, description: '리뷰 목록 조회 성공', type: ReviewListResponseDto })
  async getReviews(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<ReviewListResponseDto> {
    return await this.getReviewsUseCase.execute(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: '리뷰 단건 조회' })
  @ApiParam({ name: 'id', description: '리뷰 ID' })
  @ApiResponse({ status: 200, description: '리뷰 조회 성공', type: ReviewResponseDto })
  @ApiResponse({ status: 404, description: '리뷰를 찾을 수 없음' })
  async getReview(@Param('id') id: string): Promise<ReviewResponseDto> {
    return await this.getReviewUseCase.execute(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '리뷰 수정' })
  @ApiParam({ name: 'id', description: '리뷰 ID' })
  @ApiResponse({ status: 200, description: '리뷰 수정 성공', type: ReviewResponseDto })
  @ApiResponse({ status: 404, description: '리뷰를 찾을 수 없음' })
  async updateReview(
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    return await this.updateReviewUseCase.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '리뷰 삭제' })
  @ApiParam({ name: 'id', description: '리뷰 ID' })
  @ApiResponse({ status: 204, description: '리뷰 삭제 성공' })
  @ApiResponse({ status: 404, description: '리뷰를 찾을 수 없음' })
  async deleteReview(@Param('id') id: string): Promise<void> {
    return await this.deleteReviewUseCase.execute(id);
  }

  @Patch(':id/helpful')
  @ApiOperation({ summary: '리뷰 도움이 됨 증가' })
  @ApiParam({ name: 'id', description: '리뷰 ID' })
  @ApiResponse({ status: 200, description: '도움이 됨 증가 성공', type: ReviewResponseDto })
  @ApiResponse({ status: 404, description: '리뷰를 찾을 수 없음' })
  async incrementHelpful(@Param('id') id: string): Promise<ReviewResponseDto> {
    return await this.incrementHelpfulUseCase.execute(id);
  }
}
