import { ApiProperty } from '@nestjs/swagger';

/**
 * 리뷰 응답 DTO
 */
export class ReviewResponseDto {
  @ApiProperty({ description: '리뷰 ID' })
  id: string;

  @ApiProperty({ description: '리뷰 대상 기관 ID' })
  institutionId: string;

  @ApiProperty({ description: '기관명' })
  institutionName: string;

  @ApiProperty({ description: '작성자 ID' })
  userId: string;

  @ApiProperty({ description: '별점 (1-5)' })
  rating: number;

  @ApiProperty({ description: '리뷰 내용' })
  content: string;

  @ApiProperty({ description: '도움이 됨 카운트' })
  helpfulCount: number;

  @ApiProperty({ description: '생성일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시' })
  updatedAt: Date;
}

/**
 * 리뷰 목록 응답 DTO
 */
export class ReviewListResponseDto {
  @ApiProperty({ description: '리뷰 목록', type: [ReviewResponseDto] })
  reviews: ReviewResponseDto[];

  @ApiProperty({ description: '전체 개수' })
  total: number;

  @ApiProperty({ description: '현재 페이지' })
  page: number;

  @ApiProperty({ description: '페이지당 개수' })
  limit: number;

  @ApiProperty({ description: '전체 페이지 수' })
  totalPages: number;
}
