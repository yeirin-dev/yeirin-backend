import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, MinLength, MaxLength } from 'class-validator';
import { CounselRequestStatus } from '@domain/counsel-request/model/value-objects/counsel-request-enums';

/**
 * Admin 상태 강제 변경 가능 상태
 * (COMPLETED는 제외 - 완료된 상담은 변경 불가)
 */
export const ADMIN_ALLOWED_STATUS_CHANGES = [
  CounselRequestStatus.PENDING,
  CounselRequestStatus.RECOMMENDED,
  CounselRequestStatus.MATCHED,
  CounselRequestStatus.IN_PROGRESS,
  CounselRequestStatus.REJECTED,
] as const;

export type AdminAllowedStatus = (typeof ADMIN_ALLOWED_STATUS_CHANGES)[number];

/**
 * Admin 상담의뢰 상태 강제 변경 DTO
 */
export class AdminUpdateCounselRequestStatusDto {
  @ApiProperty({
    description: '변경할 상태',
    enum: ADMIN_ALLOWED_STATUS_CHANGES,
    example: 'REJECTED',
  })
  @IsNotEmpty({ message: '변경할 상태는 필수입니다' })
  @IsEnum(CounselRequestStatus, { message: '유효한 상태가 아닙니다' })
  newStatus: CounselRequestStatus;

  @ApiProperty({
    description: '변경 사유',
    example: '시스템 오류로 인한 상태 재조정',
    minLength: 10,
    maxLength: 500,
  })
  @IsNotEmpty({ message: '변경 사유는 필수입니다' })
  @IsString()
  @MinLength(10, { message: '변경 사유는 최소 10자 이상이어야 합니다' })
  @MaxLength(500, { message: '변경 사유는 최대 500자까지 입력 가능합니다' })
  reason: string;
}
