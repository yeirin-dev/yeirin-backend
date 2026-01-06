import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportStatus } from '@domain/counsel-report/model/value-objects/report-status';

/**
 * 면담결과지 응답 DTO
 *
 * @description
 * API 응답에 사용되는 면담결과지 데이터
 */
export class CounselReportResponseDto {
  @ApiProperty({
    description: '면담결과지 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '상담의뢰지 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  counselRequestId: string;

  @ApiProperty({
    description: '아동 ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  childId: string;

  @ApiPropertyOptional({
    description: '상담사 ID (레거시)',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  counselorId: string | null;

  @ApiPropertyOptional({
    description: '기관 ID (레거시)',
    example: '123e4567-e89b-12d3-a456-426614174004',
  })
  institutionId: string | null;

  @ApiProperty({
    description: '회차 (1회차, 2회차, ...)',
    example: 1,
  })
  sessionNumber: number;

  @ApiProperty({
    description: '의뢰(작성)일자',
    example: '2025-01-15',
  })
  reportDate: Date;

  @ApiProperty({
    description: '센터명',
    example: '행복한 심리상담센터',
  })
  centerName: string;

  @ApiPropertyOptional({
    description: '상담사 서명 이미지 URL',
    example: 'https://s3.amazonaws.com/signatures/counselor-signature.png',
  })
  counselorSignature: string | null;

  @ApiProperty({
    description: '상담 사유',
    example: 'ADHD 진단 후 집중력 향상을 위한 심리 상담',
  })
  counselReason: string;

  @ApiProperty({
    description: '상담 내용',
    example: '아동과의 1:1 대화를 통해 최근 학교생활에서의 어려움을 탐색하였습니다.',
  })
  counselContent: string;

  @ApiPropertyOptional({
    description: '센터에 전하는 피드백',
    example:
      '아동이 센터에서 또래 친구들과 긍정적인 관계를 형성할 수 있도록 집단 활동 참여를 권장해 주시기 바랍니다.',
  })
  centerFeedback: string | null;

  @ApiPropertyOptional({
    description: '가정에 전하는 피드백',
    example:
      '가정에서 아동의 감정 표현을 충분히 경청해 주시고, 긍정적인 행동에 대해 즉각적인 칭찬을 해주시면 좋겠습니다.',
  })
  homeFeedback: string | null;

  @ApiProperty({
    description: '첨부 파일 URL 목록',
    example: [
      'https://s3.amazonaws.com/reports/test-result-1.pdf',
      'https://s3.amazonaws.com/reports/drawing-therapy-1.jpg',
    ],
  })
  attachmentUrls: string[];

  @ApiProperty({
    description: '상태 (DRAFT, SUBMITTED, REVIEWED, APPROVED)',
    enum: ReportStatus,
    example: ReportStatus.DRAFT,
  })
  status: ReportStatus;

  @ApiPropertyOptional({
    description: '제출 시각',
    example: '2025-01-15T10:30:00Z',
  })
  submittedAt: Date | null;

  @ApiPropertyOptional({
    description: '보호자 확인 시각',
    example: '2025-01-16T14:20:00Z',
  })
  reviewedAt: Date | null;

  @ApiPropertyOptional({
    description: '보호자 피드백',
    example: '상담 내용 잘 확인했습니다. 집에서도 노력하겠습니다.',
  })
  guardianFeedback: string | null;

  @ApiProperty({
    description: '생성 시각',
    example: '2025-01-15T09:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정 시각',
    example: '2025-01-15T09:30:00Z',
  })
  updatedAt: Date;
}

/**
 * 페이지네이션된 면담결과지 응답 DTO
 */
export class PaginatedCounselReportResponseDto {
  @ApiProperty({
    description: '면담결과지 목록',
    type: [CounselReportResponseDto],
  })
  reports: CounselReportResponseDto[];

  @ApiProperty({
    description: '전체 개수',
    example: 50,
  })
  total: number;

  @ApiProperty({
    description: '현재 페이지',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '페이지당 항목 수',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: '전체 페이지 수',
    example: 5,
  })
  totalPages: number;
}
