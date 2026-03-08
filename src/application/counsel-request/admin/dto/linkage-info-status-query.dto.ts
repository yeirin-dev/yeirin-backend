import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { AdminPaginationQueryDto } from '@yeirin/admin-common';
import { ChildType } from '@infrastructure/persistence/typeorm/entity/enums/child-type.enum';

/**
 * 연계정보입력 현황 조회 Query DTO
 * 기관별 바우처 대상 아동 제출률 추적용
 */
export class LinkageInfoStatusQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({
    description: '시설 구분 (아동 유형)',
    enum: ChildType,
  })
  @IsOptional()
  @IsEnum(ChildType)
  childType?: ChildType;

  @ApiPropertyOptional({
    description: '구/군 필터',
    example: '해운대구',
  })
  @IsOptional()
  @IsString()
  district?: string;
}
