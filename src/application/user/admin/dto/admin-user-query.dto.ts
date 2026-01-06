import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { AdminPaginationQueryDto } from '@yeirin/admin-common';

/**
 * 사용자 역할 (필터용)
 */
export enum UserRoleFilter {
  INSTITUTION_ADMIN = 'INSTITUTION_ADMIN',
  COUNSELOR = 'COUNSELOR',
  ADMIN = 'ADMIN',
}

/**
 * 사용자 상태 (필터용)
 */
export enum UserStatusFilter {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BANNED = 'BANNED',
}

/**
 * Admin 사용자 목록 조회 쿼리 DTO
 */
export class AdminUserQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ description: '검색어 (이메일, 이름)', example: 'user@example.com' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '역할 필터', enum: UserRoleFilter })
  @IsOptional()
  @IsEnum(UserRoleFilter)
  role?: UserRoleFilter;

  @ApiPropertyOptional({ description: '상태 필터', enum: UserStatusFilter })
  @IsOptional()
  @IsEnum(UserStatusFilter)
  status?: UserStatusFilter;

  @ApiPropertyOptional({ description: '이메일 인증 여부' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isEmailVerified?: boolean;
}
