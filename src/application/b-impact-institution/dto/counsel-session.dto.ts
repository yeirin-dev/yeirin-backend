import { SessionType, SessionStatus } from '@domain/counsel-session/model/value-objects/session-enums';

export class CreateCounselSessionDto {
  voucherLinkageId: string;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  sessionType: SessionType;
  notes?: string;
}

export class UpdateCounselSessionDto {
  scheduledDate?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  sessionType?: SessionType;
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
