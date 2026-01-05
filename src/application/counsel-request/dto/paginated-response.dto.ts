import { ApiProperty } from '@nestjs/swagger';

/**
 * 페이지네이션 응답 DTO
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ description: '데이터 목록' })
  data: T[];

  @ApiProperty({ description: '전체 항목 수', example: 50 })
  total: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  page: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 10 })
  limit: number;

  @ApiProperty({ description: '전체 페이지 수', example: 5 })
  totalPages: number;

  @ApiProperty({ description: '이전 페이지 존재 여부', example: false })
  hasPreviousPage: boolean;

  @ApiProperty({ description: '다음 페이지 존재 여부', example: true })
  hasNextPage: boolean;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
    this.hasPreviousPage = page > 1;
    this.hasNextPage = page < this.totalPages;
  }
}
