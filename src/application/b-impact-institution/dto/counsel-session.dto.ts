import { IsString, IsEnum, IsOptional } from 'class-validator';
import { SessionType, SessionStatus } from '@domain/counsel-session/model/value-objects/session-enums';

export class CreateCounselSessionDto {
  @IsString()
  voucherLinkageId: string;

  @IsString()
  scheduledDate: string;

  @IsString()
  scheduledStartTime: string;

  @IsString()
  scheduledEndTime: string;

  @IsEnum(SessionType)
  sessionType: SessionType;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCounselSessionDto {
  @IsOptional()
  @IsString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  scheduledStartTime?: string;

  @IsOptional()
  @IsString()
  scheduledEndTime?: string;

  @IsOptional()
  @IsEnum(SessionType)
  sessionType?: SessionType;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CounselSessionResponseDto {
  id: string;
  voucherLinkageId: string;
  counselRequestId: string;
  childId: string;
  childName: string;
  bImpactInstitutionId: string;
  sessionNumber: number;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  sessionType: SessionType;
  status: SessionStatus;
  cancelReason?: string;
  notes?: string;
  hasRecord: boolean;
  createdAt: string;
  updatedAt: string;
}
