import { ApiProperty } from '@nestjs/swagger';
import {
  CareType,
  CounselRequestStatus,
} from '@domain/counsel-request/model/value-objects/counsel-request-enums';
import { CounselRequestFormData } from '@domain/counsel-request/model/value-objects/counsel-request-form-data';

/**
 * 상담의뢰지 응답 DTO
 */
export class CounselRequestResponseDto {
  @ApiProperty({ description: '상담의뢰지 ID' })
  id: string;

  @ApiProperty({ description: '아동 ID' })
  childId: string;

  @ApiProperty({ description: '보호자 ID' })
  guardianId: string;

  @ApiProperty({ description: '상태', enum: CounselRequestStatus })
  status: CounselRequestStatus;

  @ApiProperty({ description: '양식 데이터 (JSONB)' })
  formData: CounselRequestFormData;

  @ApiProperty({ description: '센터명 (검색용)' })
  centerName: string;

  @ApiProperty({ description: '센터 이용 기준 (검색용)', enum: CareType })
  careType: CareType;

  @ApiProperty({ description: '의뢰 일자 (검색용)' })
  requestDate: Date;

  @ApiProperty({ description: '매칭된 기관 ID', nullable: true })
  matchedInstitutionId?: string;

  @ApiProperty({ description: '매칭된 상담사 ID', nullable: true })
  matchedCounselorId?: string;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
}

/**
 * 상담의뢰지 목록 응답 DTO (페이지네이션)
 */
export class CounselRequestListResponseDto {
  @ApiProperty({ description: '상담의뢰지 목록', type: [CounselRequestResponseDto] })
  data: CounselRequestResponseDto[];

  @ApiProperty({ description: '전체 개수' })
  total: number;

  @ApiProperty({ description: '현재 페이지' })
  page: number;

  @ApiProperty({ description: '페이지당 개수' })
  limit: number;
}
