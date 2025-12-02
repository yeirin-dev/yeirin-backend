import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { PsychologicalStatus } from '@infrastructure/persistence/typeorm/entity/enums/psychological-status.enum';

/**
 * 심리 상태 업데이트 요청 DTO
 * Soul-E 챗봇에서 위험 징후 감지 시 호출
 */
export class UpdatePsychologicalStatusDto {
  @ApiProperty({
    description: '아동 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  childId: string;

  @ApiProperty({
    description: '새로운 심리 상태',
    enum: PsychologicalStatus,
    example: PsychologicalStatus.AT_RISK,
  })
  @IsEnum(PsychologicalStatus)
  newStatus: PsychologicalStatus;

  @ApiProperty({
    description: '상태 변경 사유 (위험 징후 설명)',
    example: '대화 중 자해 관련 키워드 감지: "살고 싶지 않아", "힘들어"',
  })
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    description: 'Soul-E 채팅 세션 ID',
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiPropertyOptional({
    description: '추가 메타데이터 (감지된 키워드, 대화 맥락 등)',
    example: {
      detectedKeywords: ['힘들어', '살고 싶지 않아'],
      conversationContext: '학교 왕따 관련 상담 중',
      confidenceScore: 0.85,
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

/**
 * 심리 상태 업데이트 응답 DTO
 */
export class UpdatePsychologicalStatusResponseDto {
  @ApiProperty({
    description: '아동 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  childId: string;

  @ApiProperty({
    description: '변경 전 상태',
    enum: PsychologicalStatus,
  })
  previousStatus: PsychologicalStatus;

  @ApiProperty({
    description: '변경 후 상태',
    enum: PsychologicalStatus,
  })
  newStatus: PsychologicalStatus;

  @ApiProperty({
    description: '위험도 상승 여부',
    example: true,
  })
  isEscalation: boolean;

  @ApiProperty({
    description: '상태 변경 로그 ID',
    example: '770e8400-e29b-41d4-a716-446655440002',
  })
  logId: string;

  @ApiProperty({
    description: '처리 시간',
    example: '2025-01-15T10:30:00Z',
  })
  processedAt: Date;
}
