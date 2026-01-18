import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 검사별 바우처 조건 충족 결과
 */
export class CriteriaResultDto {
  @ApiProperty({
    description: '조건 충족 여부',
    example: true,
  })
  met: boolean;

  @ApiProperty({
    description: '조건 설명',
    example: 'CRTES-R 중증도군 또는 중증군 해당',
  })
  description: string;

  @ApiPropertyOptional({
    description: '관련 값 (점수, 레벨 등)',
    example: { severity_level: 3, severity_label: '중증도' },
  })
  details?: Record<string, unknown>;
}

/**
 * 검사 완료 현황
 */
export class AssessmentStatusDto {
  @ApiProperty({
    description: 'CRTES-R 검사 완료 여부',
    example: true,
  })
  hasCrtesR: boolean;

  @ApiProperty({
    description: 'SDQ-A 검사 완료 여부',
    example: true,
  })
  hasSdqA: boolean;

  @ApiProperty({
    description: 'KPRC 검사 완료 여부',
    example: true,
  })
  hasKprc: boolean;

  @ApiProperty({
    description: 'KPRC T점수 추출 완료 여부 (KPRC 있어도 추출 미완료 가능)',
    example: true,
  })
  hasKprcTScores: boolean;
}

/**
 * 각 조건별 충족 결과
 */
export class CriteriaResultsDto {
  @ApiPropertyOptional({
    description: 'CRTES-R 조건 결과 (중증도군/중증군)',
    type: CriteriaResultDto,
  })
  crtesR?: CriteriaResultDto;

  @ApiPropertyOptional({
    description: 'SDQ-A 조건 결과 (강점/난점 경계선 또는 위험군)',
    type: CriteriaResultDto,
  })
  sdqA?: CriteriaResultDto;

  @ApiPropertyOptional({
    description: 'KPRC 조건 결과 (ERS ≤30T 또는 기타 척도 ≥65T)',
    type: CriteriaResultDto,
  })
  kprc?: CriteriaResultDto;
}

/**
 * 바우처 추천 대상 판별 결과 DTO
 */
export class VoucherEligibilityResponseDto {
  @ApiProperty({
    description: '아동 ID',
    example: 'child-uuid-123',
  })
  childId: string;

  @ApiProperty({
    description: '바우처 추천 대상 여부',
    example: true,
  })
  isEligible: boolean;

  @ApiProperty({
    description: '필수 검사 3가지 모두 완료 여부 (CRTES-R, SDQ-A, KPRC)',
    example: true,
  })
  hasAllRequiredAssessments: boolean;

  @ApiProperty({
    description: '검사 완료 현황',
    type: AssessmentStatusDto,
  })
  assessmentStatus: AssessmentStatusDto;

  @ApiPropertyOptional({
    description: '조건별 충족 결과 (3가지 검사 완료 시에만 제공)',
    type: CriteriaResultsDto,
  })
  criteriaResults?: CriteriaResultsDto;

  @ApiPropertyOptional({
    description: '충족한 조건 수 (0~3)',
    example: 2,
  })
  metCriteriaCount?: number;

  @ApiPropertyOptional({
    description: '바우처 추천 사유 요약',
    example: ['CRTES-R 중증도군 해당', 'KPRC T점수 위험 척도 감지'],
  })
  eligibilityReasons?: string[];
}
