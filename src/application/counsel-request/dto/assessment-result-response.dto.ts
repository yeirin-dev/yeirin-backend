import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * SDQ-A 척도 점수 DTO
 */
export class SdqAScaleScoresDto {
  @ApiPropertyOptional({
    description: '강점 척도',
    type: 'object',
    properties: {
      score: { type: 'number', description: '점수' },
      maxScore: { type: 'number', description: '최대 점수' },
      level: { type: 'number', description: '수준 (1: 정상, 2: 경계선, 3: 위험군)' },
      levelDescription: { type: 'string', description: '수준 설명' },
    },
  })
  strengths?: {
    score: number;
    maxScore: number;
    level: number;
    levelDescription: string;
  };

  @ApiPropertyOptional({
    description: '난점 척도',
    type: 'object',
    properties: {
      score: { type: 'number', description: '점수' },
      maxScore: { type: 'number', description: '최대 점수' },
      level: { type: 'number', description: '수준 (1: 정상, 2: 경계선, 3: 위험군)' },
      levelDescription: { type: 'string', description: '수준 설명' },
    },
  })
  difficulties?: {
    score: number;
    maxScore: number;
    level: number;
    levelDescription: string;
  };
}

/**
 * Soul-E 심리검사 결과 요약 응답 DTO
 */
export class AssessmentResultResponseDto {
  @ApiProperty({ description: '검사 결과 ID' })
  resultId: string;

  @ApiProperty({ description: '검사 세션 ID' })
  sessionId: string;

  @ApiProperty({ description: '아동 ID' })
  childId: string;

  @ApiProperty({ description: '아동 이름' })
  childName: string;

  @ApiProperty({ description: '검사 유형 코드', example: 'KPRC_CO_SG_E' })
  assessmentType: string;

  @ApiProperty({ description: '검사명', example: 'KPRC 초등 고학년용 표준형' })
  assessmentName: string;

  @ApiPropertyOptional({ description: '총점', nullable: true })
  totalScore?: number | null;

  @ApiPropertyOptional({ description: '최대 점수', nullable: true })
  maxScore?: number | null;

  @ApiPropertyOptional({
    description: '전체 해석 수준',
    enum: ['normal', 'caution', 'clinical'],
    nullable: true,
  })
  overallLevel?: string | null;

  @ApiPropertyOptional({
    description: 'Soul-E에서 생성된 상세 리포트 PDF URL (S3)',
    nullable: true,
  })
  reportUrl?: string | null;

  @ApiPropertyOptional({
    description: '척도별 점수 (SDQ-A: 강점/난점)',
    type: SdqAScaleScoresDto,
    nullable: true,
  })
  scaleScores?: SdqAScaleScoresDto | Record<string, unknown> | null;

  @ApiPropertyOptional({ description: '채점 일시', nullable: true })
  scoredAt?: string | null;

  @ApiProperty({ description: '결과 생성 일시' })
  createdAt: string;
}
