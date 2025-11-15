import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';

/**
 * 리뷰 수정 DTO
 */
export class UpdateReviewDto {
  @ApiProperty({ description: '별점 (1-5)', example: 4, minimum: 1, maximum: 5, required: false })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiProperty({ description: '리뷰 내용', example: '상담 진행이 매우 만족스러웠습니다.', required: false })
  @IsString()
  @IsOptional()
  content?: string;
}
