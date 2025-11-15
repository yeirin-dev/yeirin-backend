import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsUUID, IsOptional, Min, Max, MaxLength } from 'class-validator';

/**
 * 리뷰 생성 DTO
 */
export class CreateReviewDto {
  @ApiProperty({ description: '리뷰 대상 기관 ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  institutionId: string;

  @ApiProperty({ description: '작성자 ID (회원인 경우)', example: '660e8400-e29b-41d4-a716-446655440000', required: false })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({ description: '작성자 닉네임', example: '익명사용자' })
  @IsString()
  @MaxLength(50)
  authorNickname: string;

  @ApiProperty({ description: '별점 (1-5)', example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: '리뷰 내용', example: '상담사님이 정말 친절하고 아이에게 큰 도움이 되었습니다.' })
  @IsString()
  content: string;
}
