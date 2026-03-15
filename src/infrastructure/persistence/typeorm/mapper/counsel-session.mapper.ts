import { CounselSession } from '@domain/counsel-session/model/counsel-session';
import { CounselSessionEntity } from '../entity/counsel-session.entity';

export class CounselSessionMapper {
  static toDomain(entity: CounselSessionEntity): CounselSession {
    return CounselSession.restore({
      id: entity.id,
      voucherLinkageId: entity.voucherLinkageId,
      counselRequestId: entity.counselRequestId,
      childId: entity.childId,
      bImpactInstitutionId: entity.bImpactInstitutionId,
      sessionNumber: entity.sessionNumber,
      scheduledDate: entity.scheduledDate,
      scheduledStartTime: entity.scheduledStartTime,
      scheduledEndTime: entity.scheduledEndTime,
      sessionType: entity.sessionType,
      status: entity.status,
      cancelReason: entity.cancelReason,
      notes: entity.notes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toEntity(domain: CounselSession): CounselSessionEntity {
    const entity = new CounselSessionEntity();
    entity.id = domain.id;
    entity.voucherLinkageId = domain.voucherLinkageId;
    entity.counselRequestId = domain.counselRequestId;
    entity.childId = domain.childId;
    entity.bImpactInstitutionId = domain.bImpactInstitutionId;
    entity.sessionNumber = domain.sessionNumber;
    entity.scheduledDate = domain.scheduledDate;
    entity.scheduledStartTime = domain.scheduledStartTime;
    entity.scheduledEndTime = domain.scheduledEndTime;
    entity.sessionType = domain.sessionType;
    entity.status = domain.status;
    entity.cancelReason = domain.cancelReason;
    entity.notes = domain.notes;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}
