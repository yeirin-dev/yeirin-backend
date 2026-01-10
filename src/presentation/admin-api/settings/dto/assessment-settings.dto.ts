import { IsArray, IsBoolean, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 개별 검사 설정 DTO
 */
export class AssessmentSettingDto {
  @ApiProperty({ description: '검사 타입', example: 'CRTES_R' })
  @IsString()
  assessmentType: string;

  @ApiProperty({ description: '활성화 여부', example: true })
  @IsBoolean()
  isEnabled: boolean;
}

/**
 * 검사 설정 업데이트 요청 DTO
 */
export class UpdateAssessmentSettingsDto {
  @ApiProperty({
    description: '검사 설정 목록',
    type: [AssessmentSettingDto],
    example: [
      { assessmentType: 'CRTES_R', isEnabled: true },
      { assessmentType: 'SDQ_A', isEnabled: false },
      { assessmentType: 'KPRC_CO_SG_E', isEnabled: true },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssessmentSettingDto)
  settings: AssessmentSettingDto[];
}

/**
 * 검사 설정 응답 DTO
 */
export class AssessmentSettingsResponseDto {
  @ApiProperty({ description: '검사 타입' })
  assessmentType: string;

  @ApiProperty({ description: '활성화 여부' })
  isEnabled: boolean;

  @ApiProperty({ description: '표시 이름' })
  displayName: string;

  @ApiProperty({ description: '마지막 수정일' })
  updatedAt: Date;
}
