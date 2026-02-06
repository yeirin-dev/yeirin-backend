import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CounselRequestStatus,
  CareType,
} from '@domain/counsel-request/model/value-objects/counsel-request-enums';
import { CounselRequestFormData } from '@domain/counsel-request/model/value-objects/counsel-request-form-data';
import { VoucherLinkageStatus } from '@domain/voucher-linkage/model/voucher-linkage';

/**
 * Admin 상담의뢰 목록 응답 DTO
 */
export class AdminCounselRequestResponseDto {
  @ApiProperty({ description: '상담의뢰 ID' })
  id: string;

  @ApiProperty({ description: '아동 ID' })
  childId: string;

  @ApiProperty({ description: '아동 이름' })
  childName: string;

  @ApiProperty({ description: '상태', enum: CounselRequestStatus })
  status: CounselRequestStatus;

  @ApiProperty({ description: '센터명' })
  centerName: string;

  @ApiProperty({ description: '돌봄 유형', enum: CareType })
  careType: CareType;

  @ApiProperty({ description: '의뢰 일자' })
  requestDate: Date;

  @ApiPropertyOptional({ description: '매칭된 기관 ID' })
  matchedInstitutionId?: string;

  @ApiPropertyOptional({ description: '매칭된 기관명' })
  matchedInstitutionName?: string;

  @ApiPropertyOptional({ description: '매칭된 상담사 ID' })
  matchedCounselorId?: string;

  @ApiPropertyOptional({ description: '매칭된 상담사명' })
  matchedCounselorName?: string;

  @ApiPropertyOptional({ description: '바우처 추천대상 여부' })
  isVoucherEligible?: boolean;

  @ApiPropertyOptional({
    description: '바우처 추천 사유 목록',
    type: [String],
    example: ['CRTES-R 심각도 2등급 이상', 'SDQ-A 수준 2등급 이상'],
  })
  voucherEligibilityReasons?: string[];

  @ApiPropertyOptional({
    description: '바우처 연계 상태',
    enum: VoucherLinkageStatus,
    example: VoucherLinkageStatus.PENDING,
  })
  voucherLinkageStatus?: VoucherLinkageStatus;

  @ApiPropertyOptional({ description: '바우처 연계 완료일' })
  voucherLinkedAt?: Date;

  @ApiPropertyOptional({ description: '통합보고서 S3 키' })
  integratedReportS3Key?: string;

  @ApiPropertyOptional({ description: '통합보고서 상태' })
  integratedReportStatus?: string;

  @ApiPropertyOptional({ description: '통합보고서 Presigned URL' })
  integratedReportUrl?: string;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
}

/**
 * 상태 변경 히스토리 항목
 */
export class StatusHistoryItemDto {
  @ApiProperty({ description: '이전 상태' })
  fromStatus: string;

  @ApiProperty({ description: '변경 후 상태' })
  toStatus: string;

  @ApiProperty({ description: '변경 사유' })
  reason: string;

  @ApiProperty({ description: '변경자 ID' })
  changedBy: string;

  @ApiProperty({ description: '변경자 이름' })
  changedByName: string;

  @ApiProperty({ description: '변경 일시' })
  changedAt: Date;
}

/**
 * 바우처 연계 정보 응답 DTO
 */
export class VoucherLinkageResponseDto {
  @ApiProperty({ description: '바우처 연계 ID' })
  id: string;

  @ApiProperty({ description: '연계 상태', enum: VoucherLinkageStatus })
  status: VoucherLinkageStatus;

  @ApiPropertyOptional({ description: '연계 기관명' })
  linkedInstitutionName?: string;

  @ApiPropertyOptional({ description: '연계 기관 연락처' })
  linkedInstitutionPhone?: string;

  @ApiPropertyOptional({ description: '연계 기관 주소' })
  linkedInstitutionAddress?: string;

  @ApiPropertyOptional({ description: '담당 상담사명' })
  linkedCounselorName?: string;

  @ApiPropertyOptional({ description: '연계 완료일' })
  linkedAt?: Date;

  @ApiPropertyOptional({ description: '비고' })
  notes?: string;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
}

/**
 * Admin 상담의뢰 상세 응답 DTO
 */
export class AdminCounselRequestDetailResponseDto extends AdminCounselRequestResponseDto {
  @ApiProperty({ description: '양식 데이터 (전체)' })
  formData: CounselRequestFormData;

  @ApiPropertyOptional({ description: '상태 변경 히스토리', type: [StatusHistoryItemDto] })
  statusHistory?: StatusHistoryItemDto[];

  @ApiPropertyOptional({ description: '관련 상담보고서 수' })
  reportCount?: number;

  @ApiPropertyOptional({ description: '리뷰 평점' })
  reviewRating?: number;

  @ApiPropertyOptional({ description: '바우처 추천대상 확인일' })
  voucherEligibilityCheckedAt?: Date;

  @ApiPropertyOptional({ description: '바우처 연계 정보', type: VoucherLinkageResponseDto })
  voucherLinkage?: VoucherLinkageResponseDto;
}
