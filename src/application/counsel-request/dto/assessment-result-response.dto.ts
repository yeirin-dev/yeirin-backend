import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({ description: '채점 일시', nullable: true })
  scoredAt?: string | null;

  @ApiProperty({ description: '결과 생성 일시' })
  createdAt: string;
}
