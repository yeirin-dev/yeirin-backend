import { CareFacility } from '@domain/care-facility/model/care-facility';
import { Address } from '@domain/common/value-objects/address.vo';
import { InstitutionName } from '@domain/common/value-objects/institution-name.vo';
import { CareFacilityEntity } from '../entity/care-facility.entity';

/**
 * CareFacility Domain ↔ Entity 변환 Mapper
 */
export class CareFacilityMapper {
  /**
   * Entity → Domain 변환
   */
  static toDomain(entity: CareFacilityEntity): CareFacility {
    return CareFacility.restore({
      id: entity.id,
      name: InstitutionName.restore(entity.name),
      address: Address.restore(entity.address, entity.addressDetail, entity.postalCode),
      representativeName: entity.representativeName,
      phoneNumber: entity.phoneNumber,
      capacity: entity.capacity,
      establishedDate: new Date(entity.establishedDate),
      introduction: entity.introduction || undefined,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Domain → Entity 변환 (Partial for save)
   */
  static toEntity(domain: CareFacility): Partial<CareFacilityEntity> {
    return {
      id: domain.id,
      name: domain.name.value,
      address: domain.address.address,
      addressDetail: domain.address.addressDetail,
      postalCode: domain.address.postalCode,
      representativeName: domain.representativeName,
      phoneNumber: domain.phoneNumber,
      capacity: domain.capacity,
      establishedDate: domain.establishedDate,
      introduction: domain.introduction,
      isActive: domain.isActive,
    };
  }

  /**
   * Entity 목록 → Domain 목록 변환
   */
  static toDomainList(entities: CareFacilityEntity[]): CareFacility[] {
    return entities.map((entity) => CareFacilityMapper.toDomain(entity));
  }
}
