import { ApiProperty } from '@nestjs/swagger';

/**
 * 상담사 프로필 응답 DTO
 */
export class CounselorProfileResponseDto {
  @ApiProperty({ description: '상담사 ID' })
  id: string;

  @ApiProperty({ description: '소속 기관 ID' })
  institutionId: string;

  @ApiProperty({ description: '소속 기관명' })
  institutionName: string;

  @ApiProperty({ description: '상담사 이름' })
  name: string;

  @ApiProperty({ description: '경력 (년)' })
  experienceYears: number;

  @ApiProperty({ description: '보유 자격증 목록' })
  certifications: string[];

  @ApiProperty({ description: '전문 분야 목록' })
  specialties: string[];

  @ApiProperty({ description: '소개' })
  introduction: string;

  @ApiProperty({ description: '생성일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시' })
  updatedAt: Date;
}

/**
 * 상담사 프로필 목록 응답 DTO
 */
export class CounselorProfileListResponseDto {
  @ApiProperty({ description: '상담사 목록', type: [CounselorProfileResponseDto] })
  counselors: CounselorProfileResponseDto[];

  @ApiProperty({ description: '전체 개수' })
  total: number;

  @ApiProperty({ description: '현재 페이지' })
  page: number;

  @ApiProperty({ description: '페이지당 개수' })
  limit: number;

  @ApiProperty({ description: '전체 페이지 수' })
  totalPages: number;
}
