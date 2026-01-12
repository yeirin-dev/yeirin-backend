import { Address } from '@domain/common/value-objects/address.vo';
import { InstitutionName } from '@domain/common/value-objects/institution-name.vo';
import { EducationWelfareSchool } from '@domain/education-welfare-school/model/education-welfare-school';
import { EducationWelfareSchoolEntity } from '../entity/education-welfare-school.entity';

/**
 * EducationWelfareSchool Domain ↔ EducationWelfareSchoolEntity 변환
 * Anti-Corruption Layer (ACL)
 */
export class EducationWelfareSchoolMapper {
  /**
   * Entity → Domain
   */
  public static toDomain(entity: EducationWelfareSchoolEntity): EducationWelfareSchool {
    return EducationWelfareSchool.restore({
      id: entity.id,
      name: InstitutionName.restore(entity.name),
      address: Address.restore(entity.address, entity.addressDetail, entity.postalCode),
      welfareWorkerName: entity.welfareWorkerName,
      welfareWorkerPhone: entity.welfareWorkerPhone,
      phoneNumber: entity.phoneNumber ?? undefined,
      email: entity.email ?? undefined,
      expectedChildCount: entity.expectedChildCount ?? undefined,
      linkedCenterName: entity.linkedCenterName ?? undefined,
      linkedCenterAddress: entity.linkedCenterAddress ?? undefined,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Domain → Entity (Partial for save)
   * Note: district와 password는 도메인에서 관리하지 않으므로 제외됨
   */
  public static toEntity(school: EducationWelfareSchool): Partial<EducationWelfareSchoolEntity> {
    return {
      id: school.id,
      name: school.name.value,
      address: school.address.address,
      addressDetail: school.address.addressDetail,
      postalCode: school.address.postalCode,
      welfareWorkerName: school.welfareWorkerName,
      welfareWorkerPhone: school.welfareWorkerPhone,
      phoneNumber: school.phoneNumber,
      email: school.email,
      expectedChildCount: school.expectedChildCount,
      linkedCenterName: school.linkedCenterName,
      linkedCenterAddress: school.linkedCenterAddress,
      isActive: school.isActive,
    };
  }

  /**
   * Entity 리스트 → Domain 리스트
   */
  public static toDomainList(entities: EducationWelfareSchoolEntity[]): EducationWelfareSchool[] {
    return entities.map((entity) => this.toDomain(entity));
  }
}
