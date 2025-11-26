import { CounselReport, FullCounselReportProps } from '@domain/counsel-report/model/counsel-report';
import { CounselReportEntity } from '../entity/counsel-report.entity';

/**
 * CounselReport Mapper (Anti-Corruption Layer)
 *
 * @description
 * Domain Model ↔ Infrastructure Entity 변환
 * Domain과 Infrastructure 계층을 분리하여 각각의 변경에 독립적
 */
export class CounselReportMapper {
  /**
   * Entity → Domain Model
   */
  public static toDomain(entity: CounselReportEntity): CounselReport {
    const props: FullCounselReportProps = {
      id: entity.id,
      counselRequestId: entity.counselRequestId,
      childId: entity.childId,
      counselorId: entity.counselorId,
      institutionId: entity.institutionId,
      sessionNumber: entity.sessionNumber,
      reportDate: entity.reportDate,
      centerName: entity.centerName,
      counselorSignature: entity.counselorSignature,
      counselReason: entity.counselReason,
      counselContent: entity.counselContent,
      centerFeedback: entity.centerFeedback,
      homeFeedback: entity.homeFeedback,
      attachmentUrls: entity.attachmentUrls || [],
      status: entity.status,
      submittedAt: entity.submittedAt,
      reviewedAt: entity.reviewedAt,
      guardianFeedback: entity.guardianFeedback,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
    return CounselReport.restore(props);
  }

  /**
   * Domain Model → Entity
   */
  public static toEntity(domain: CounselReport): CounselReportEntity {
    const entity = new CounselReportEntity();

    entity.id = domain.id;
    entity.counselRequestId = domain.counselRequestId;
    entity.childId = domain.childId;
    entity.counselorId = domain.counselorId;
    entity.institutionId = domain.institutionId;
    entity.sessionNumber = domain.sessionNumber;
    entity.reportDate = domain.reportDate;
    entity.centerName = domain.centerName;
    entity.counselorSignature = domain.counselorSignature;
    entity.counselReason = domain.counselReason;
    entity.counselContent = domain.counselContent;
    entity.centerFeedback = domain.centerFeedback;
    entity.homeFeedback = domain.homeFeedback;
    entity.attachmentUrls = domain.attachmentUrls;
    entity.status = domain.status;
    entity.submittedAt = domain.submittedAt;
    entity.reviewedAt = domain.reviewedAt;
    entity.guardianFeedback = domain.guardianFeedback;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;

    return entity;
  }

  /**
   * Entity 배열 → Domain Model 배열
   */
  public static toDomainList(entities: CounselReportEntity[]): CounselReport[] {
    return entities.map((entity) => this.toDomain(entity));
  }

  /**
   * Domain Model 배열 → Entity 배열
   */
  public static toEntityList(domains: CounselReport[]): CounselReportEntity[] {
    return domains.map((domain) => this.toEntity(domain));
  }
}
