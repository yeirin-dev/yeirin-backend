import { Address } from '@domain/common/value-objects/address.vo';
import { InstitutionName } from '@domain/common/value-objects/institution-name.vo';
import { CommunityChildCenter } from '@domain/community-child-center/model/community-child-center';
import { CommunityChildCenterEntity } from '../entity/community-child-center.entity';

/**
 * CommunityChildCenter Domain ↔ Entity 변환 Mapper
 */
export class CommunityChildCenterMapper {
  /**
   * Entity → Domain 변환
   */
  static toDomain(entity: CommunityChildCenterEntity): CommunityChildCenter {
    return CommunityChildCenter.restore({
      id: entity.id,
      name: InstitutionName.restore(entity.name),
      address: Address.restore(entity.address, entity.addressDetail, entity.postalCode),
      directorName: entity.directorName,
      phoneNumber: entity.phoneNumber ?? undefined,
      capacity: entity.capacity ?? undefined,
      establishedDate: entity.establishedDate ? new Date(entity.establishedDate) : undefined,
      introduction: entity.introduction || undefined,
      operatingHours: entity.operatingHours || undefined,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Domain → Entity 변환 (Partial for save)
   */
  static toEntity(domain: CommunityChildCenter): Partial<CommunityChildCenterEntity> {
    return {
      id: domain.id,
      name: domain.name.value,
      address: domain.address.address,
      addressDetail: domain.address.addressDetail,
      postalCode: domain.address.postalCode,
      directorName: domain.directorName,
      phoneNumber: domain.phoneNumber,
      capacity: domain.capacity,
      establishedDate: domain.establishedDate,
      introduction: domain.introduction,
      operatingHours: domain.operatingHours,
      isActive: domain.isActive,
    };
  }

  /**
   * Entity 목록 → Domain 목록 변환
   */
  static toDomainList(entities: CommunityChildCenterEntity[]): CommunityChildCenter[] {
    return entities.map((entity) => CommunityChildCenterMapper.toDomain(entity));
  }
}
