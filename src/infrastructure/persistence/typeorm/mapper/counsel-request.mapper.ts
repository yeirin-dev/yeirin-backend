import {
  CounselRequest,
  IntegratedReportStatus,
} from '@domain/counsel-request/model/counsel-request';
import { CounselRequestEntity } from '../entity/counsel-request.entity';

/**
 * CounselRequest Mapper
 * Domain ↔ Infrastructure 변환 (Anti-Corruption Layer)
 */
export class CounselRequestMapper {
  /**
   * Entity → Domain
   */
  static toDomain(entity: CounselRequestEntity): CounselRequest {
    return CounselRequest.restore({
      id: entity.id,
      childId: entity.childId,
      guardianId: entity.guardianId,
      status: entity.status,
      formData: entity.formData,
      centerName: entity.centerName,
      careType: entity.careType,
      requestDate: entity.requestDate,
      matchedInstitutionId: entity.matchedInstitutionId,
      matchedCounselorId: entity.matchedCounselorId,
      integratedReportS3Key: entity.integratedReportS3Key,
      integratedReportStatus: entity.integratedReportStatus as IntegratedReportStatus | undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Domain → Entity
   */
  static toEntity(domain: CounselRequest): CounselRequestEntity {
    const entity = new CounselRequestEntity();
    entity.id = domain.id;
    entity.childId = domain.childId;
    entity.guardianId = domain.guardianId;
    entity.status = domain.status;
    entity.formData = domain.formData;
    entity.centerName = domain.centerName;
    entity.careType = domain.careType;
    entity.requestDate = domain.requestDate;
    entity.matchedInstitutionId = domain.matchedInstitutionId;
    entity.matchedCounselorId = domain.matchedCounselorId;
    entity.integratedReportS3Key = domain.integratedReportS3Key;
    entity.integratedReportStatus = domain.integratedReportStatus;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}
