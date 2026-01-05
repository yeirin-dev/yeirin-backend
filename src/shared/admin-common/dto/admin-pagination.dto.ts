import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsString, IsEnum, IsDateString } from 'class-validator';

/**
 * 정렬 방향
 */
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * Admin 공통 페이지네이션 쿼리 DTO
 */
export class AdminPaginationQueryDto {
  @ApiPropertyOptional({
    description: '페이지 번호 (1부터 시작)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지당 항목 수',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: '정렬 기준 필드',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: '정렬 방향',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  /**
   * offset 계산 헬퍼
   */
  get offset(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 20);
  }
}

/**
 * 기간 필터가 포함된 Admin 쿼리 DTO
 */
export class AdminDateRangeQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({
    description: '조회 시작일 (ISO 8601)',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: '조회 종료일 (ISO 8601)',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  /**
   * Date 객체로 변환된 시작일
   */
  get startDateValue(): Date | undefined {
    return this.startDate ? new Date(this.startDate) : undefined;
  }

  /**
   * Date 객체로 변환된 종료일
   */
  get endDateValue(): Date | undefined {
    return this.endDate ? new Date(this.endDate) : undefined;
  }
}

/**
 * Admin 공통 페이지네이션 응답 DTO
 */
export class AdminPaginatedResponseDto<T> {
  @ApiProperty({ description: '데이터 목록' })
  data: T[];

  @ApiProperty({ description: '전체 항목 수' })
  total: number;

  @ApiProperty({ description: '현재 페이지' })
  page: number;

  @ApiProperty({ description: '페이지당 항목 수' })
  limit: number;

  @ApiProperty({ description: '전체 페이지 수' })
  totalPages: number;

  @ApiProperty({ description: '다음 페이지 존재 여부' })
  hasNext: boolean;

  @ApiProperty({ description: '이전 페이지 존재 여부' })
  hasPrev: boolean;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
    this.hasNext = page < this.totalPages;
    this.hasPrev = page > 1;
  }

  /**
   * 정적 팩토리 메서드
   */
  static of<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): AdminPaginatedResponseDto<T> {
    return new AdminPaginatedResponseDto(data, total, page, limit);
  }
}

/**
 * Admin 공통 검색 쿼리 DTO
 */
export class AdminSearchQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({
    description: '검색어',
    example: '홍길동',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: '검색 대상 필드 (쉼표로 구분)',
    example: 'name,email',
  })
  @IsOptional()
  @IsString()
  searchFields?: string;

  /**
   * 검색 필드 배열로 변환
   */
  get searchFieldsArray(): string[] {
    return this.searchFields?.split(',').map((f) => f.trim()) || [];
  }
}
