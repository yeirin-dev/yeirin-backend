import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateReviewDto } from '@application/review/dto/create-review.dto';
import { ReviewResponseDto } from '@application/review/dto/review-response.dto';
import { UpdateReviewDto } from '@application/review/dto/update-review.dto';
import { CreateReviewUseCase } from '@application/review/use-case/create-review/create-review.use-case';
import { DeleteReviewUseCase } from '@application/review/use-case/delete-review/delete-review.use-case';
import { UpdateReviewUseCase } from '@application/review/use-case/update-review/update-review.use-case';

@ApiTags('리뷰')
@Controller('reviews')
@ApiBearerAuth()
export class ReviewController {
  constructor(
    private readonly createReviewUseCase: CreateReviewUseCase,
    private readonly updateReviewUseCase: UpdateReviewUseCase,
    private readonly deleteReviewUseCase: DeleteReviewUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: '리뷰 생성' })
  @ApiResponse({ status: 201, description: '리뷰 생성 성공', type: ReviewResponseDto })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 409, description: '이미 리뷰를 작성함' })
  async createReview(
    @Body() dto: CreateReviewDto,
    @Req() req: any,
  ): Promise<ReviewResponseDto> {
    // JWT에서 userId 추출 (추후 구현)
    const userId = req.user?.userId || dto.userId;
    return await this.createReviewUseCase.execute({ ...dto, userId });
  }

  @Put(':id')
  @ApiOperation({ summary: '리뷰 수정' })
  @ApiParam({ name: 'id', description: '리뷰 ID' })
  @ApiResponse({ status: 200, description: '리뷰 수정 성공', type: ReviewResponseDto })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '리뷰를 찾을 수 없음' })
  async updateReview(
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
    @Req() req: any,
  ): Promise<ReviewResponseDto> {
    const userId = req.user?.userId || 'temp-user'; // 임시
    return await this.updateReviewUseCase.execute(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '리뷰 삭제' })
  @ApiParam({ name: 'id', description: '리뷰 ID' })
  @ApiResponse({ status: 204, description: '리뷰 삭제 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '리뷰를 찾을 수 없음' })
  async deleteReview(@Param('id') id: string, @Req() req: any): Promise<void> {
    const userId = req.user?.userId || 'temp-user'; // 임시
    await this.deleteReviewUseCase.execute(id, userId);
  }
}
