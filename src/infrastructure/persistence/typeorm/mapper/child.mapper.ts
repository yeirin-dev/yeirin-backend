import { Child } from '@domain/child/model/child';
import { BirthDate } from '@domain/child/model/value-objects/birth-date.vo';
import { ChildName } from '@domain/child/model/value-objects/child-name.vo';
import { ChildType, ChildTypeValue } from '@domain/child/model/value-objects/child-type.vo';
import { Gender, GenderType } from '@domain/child/model/value-objects/gender.vo';
import { ChildProfileEntity } from '../entity/child-profile.entity';
import { ChildType as ChildTypeEnum } from '../entity/enums/child-type.enum';

/**
 * Child Domain ↔ ChildProfileEntity 변환
 * Anti-Corruption Layer (ACL)
 */
export class ChildMapper {
  /**
   * Entity → Domain
   */
  public static toDomain(entity: ChildProfileEntity): Child {
    // Value Object 생성
    const childTypeResult = ChildType.create(
      ChildMapper.mapChildTypeEnumToDomain(entity.childType),
    );
    const nameResult = ChildName.create(entity.name);
    const birthDateResult = BirthDate.create(new Date(entity.birthDate));
    const genderResult = Gender.create(entity.gender as GenderType);

    // Entity는 이미 DB에서 검증된 데이터이므로 실패하지 않음
    if (
      childTypeResult.isFailure ||
      nameResult.isFailure ||
      birthDateResult.isFailure ||
      genderResult.isFailure
    ) {
      throw new Error('Invalid entity data from database');
    }

    return Child.restore(
      {
        childType: childTypeResult.getValue(),
        name: nameResult.getValue(),
        birthDate: birthDateResult.getValue(),
        gender: genderResult.getValue(),
        careFacilityId: entity.careFacilityId,
        communityChildCenterId: entity.communityChildCenterId,
        guardianId: entity.guardianId,
        medicalInfo: entity.medicalInfo ?? undefined,
        specialNeeds: entity.specialNeeds ?? undefined,
      },
      entity.id,
      entity.createdAt,
    );
  }

  /**
   * Domain → Entity
   */
  public static toEntity(child: Child): ChildProfileEntity {
    const entity = new ChildProfileEntity();
    entity.id = child.id;
    entity.childType = ChildMapper.mapChildTypeDomainToEnum(child.childType.value);
    entity.name = child.name.value;
    entity.birthDate = child.birthDate.value;
    entity.gender = child.gender.value;
    entity.careFacilityId = child.careFacilityId;
    entity.communityChildCenterId = child.communityChildCenterId;
    entity.guardianId = child.guardianId;
    entity.medicalInfo = child.medicalInfo;
    entity.specialNeeds = child.specialNeeds;
    entity.createdAt = child.createdAt;
    entity.updatedAt = child.updatedAt;

    return entity;
  }

  /**
   * Infrastructure Enum → Domain Value
   */
  private static mapChildTypeEnumToDomain(enumValue: ChildTypeEnum): ChildTypeValue {
    const mapping: Record<ChildTypeEnum, ChildTypeValue> = {
      [ChildTypeEnum.CARE_FACILITY]: ChildTypeValue.CARE_FACILITY,
      [ChildTypeEnum.COMMUNITY_CENTER]: ChildTypeValue.COMMUNITY_CENTER,
      [ChildTypeEnum.REGULAR]: ChildTypeValue.REGULAR,
    };
    return mapping[enumValue];
  }

  /**
   * Domain Value → Infrastructure Enum
   */
  private static mapChildTypeDomainToEnum(domainValue: ChildTypeValue): ChildTypeEnum {
    const mapping: Record<ChildTypeValue, ChildTypeEnum> = {
      [ChildTypeValue.CARE_FACILITY]: ChildTypeEnum.CARE_FACILITY,
      [ChildTypeValue.COMMUNITY_CENTER]: ChildTypeEnum.COMMUNITY_CENTER,
      [ChildTypeValue.REGULAR]: ChildTypeEnum.REGULAR,
    };
    return mapping[domainValue];
  }
}
