import { Child } from '@domain/child/model/child';
import { ChildName } from '@domain/child/model/value-objects/child-name.vo';
import { BirthDate } from '@domain/child/model/value-objects/birth-date.vo';
import { Gender, GenderType } from '@domain/child/model/value-objects/gender.vo';
import { ChildProfileEntity } from '../entity/child-profile.entity';

/**
 * Child Domain ↔ ChildProfileEntity 변환
 * Anti-Corruption Layer (ACL)
 */
export class ChildMapper {
  /**
   * Entity → Domain
   */
  public static toDomain(entity: ChildProfileEntity): Child {
    const nameResult = ChildName.create(entity.name);
    const birthDateResult = BirthDate.create(new Date(entity.birthDate));
    const genderResult = Gender.create(entity.gender as GenderType);

    // Entity는 이미 DB에서 검증된 데이터이므로 실패하지 않음
    if (nameResult.isFailure || birthDateResult.isFailure || genderResult.isFailure) {
      throw new Error('Invalid entity data from database');
    }

    return Child.restore(
      {
        name: nameResult.getValue(),
        birthDate: birthDateResult.getValue(),
        gender: genderResult.getValue(),
        guardianId: entity.guardianId,
        institutionId: entity.institutionId,
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
    entity.name = child.name.value;
    entity.birthDate = child.birthDate.value;
    entity.gender = child.gender.value;
    entity.guardianId = child.guardianId;
    entity.institutionId = child.institutionId;
    entity.medicalInfo = child.medicalInfo;
    entity.specialNeeds = child.specialNeeds;
    entity.createdAt = child.createdAt;
    entity.updatedAt = child.updatedAt;

    return entity;
  }
}
