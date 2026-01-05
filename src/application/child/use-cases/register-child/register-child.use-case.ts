import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CareFacilityRepository } from '@domain/care-facility/repository/care-facility.repository';
import { Child } from '@domain/child/model/child';
import { BirthDate } from '@domain/child/model/value-objects/birth-date.vo';
import { ChildName } from '@domain/child/model/value-objects/child-name.vo';
import { ChildType, ChildTypeValue } from '@domain/child/model/value-objects/child-type.vo';
import { Gender } from '@domain/child/model/value-objects/gender.vo';
import { ChildRepository } from '@domain/child/repository/child.repository';
import { CommunityChildCenterRepository } from '@domain/community-child-center/repository/community-child-center.repository';
import { ChildType as ChildTypeEnum } from '@infrastructure/persistence/typeorm/entity/enums/child-type.enum';
import { ChildResponseDto } from '../../dto/child-response.dto';
import { RegisterChildDto } from '../../dto/register-child.dto';

/**
 * 아동 등록 Use Case
 *
 * 아동 유형별 관계 비즈니스 규칙:
 * - CARE_FACILITY (양육시설 아동): careFacilityId 필수
 * - COMMUNITY_CENTER (지역아동센터 아동): communityChildCenterId 필수
 *
 * NOTE: 모든 아동은 시설(Institution)에 직접 연결됩니다.
 */
@Injectable()
export class RegisterChildUseCase {
  constructor(
    @Inject('ChildRepository')
    private readonly childRepository: ChildRepository,
    @Inject('CareFacilityRepository')
    private readonly careFacilityRepository: CareFacilityRepository,
    @Inject('CommunityChildCenterRepository')
    private readonly communityChildCenterRepository: CommunityChildCenterRepository,
  ) {}

  async execute(dto: RegisterChildDto): Promise<ChildResponseDto> {
    // 1. 아동 유형별 관계 검증
    await this.validateRelationshipsByChildType(dto);

    // 2. Value Objects 생성
    const childTypeResult = ChildType.create(this.mapChildTypeEnumToDomain(dto.childType));
    if (childTypeResult.isFailure) {
      throw new BadRequestException(childTypeResult.getError().message);
    }

    const nameResult = ChildName.create(dto.name);
    if (nameResult.isFailure) {
      throw new BadRequestException(nameResult.getError().message);
    }

    const birthDateResult = BirthDate.create(new Date(dto.birthDate));
    if (birthDateResult.isFailure) {
      throw new BadRequestException(birthDateResult.getError().message);
    }

    const genderResult = Gender.create(dto.gender);
    if (genderResult.isFailure) {
      throw new BadRequestException(genderResult.getError().message);
    }

    // 3. Child Aggregate 생성
    const childResult = Child.create({
      childType: childTypeResult.getValue(),
      name: nameResult.getValue(),
      birthDate: birthDateResult.getValue(),
      gender: genderResult.getValue(),
      careFacilityId: dto.careFacilityId ?? null,
      communityChildCenterId: dto.communityChildCenterId ?? null,
      medicalInfo: dto.medicalInfo,
      specialNeeds: dto.specialNeeds,
    });

    if (childResult.isFailure) {
      throw new BadRequestException(childResult.getError().message);
    }

    // 4. 저장
    const child = await this.childRepository.save(childResult.getValue());

    // 5. DTO 변환 및 반환
    return ChildResponseDto.fromDomain(child);
  }

  /**
   * 아동 유형별 관계 검증
   */
  private async validateRelationshipsByChildType(dto: RegisterChildDto): Promise<void> {
    switch (dto.childType) {
      case ChildTypeEnum.CARE_FACILITY:
        await this.validateCareFacilityChild(dto);
        break;
      case ChildTypeEnum.COMMUNITY_CENTER:
        await this.validateCommunityChildCenterChild(dto);
        break;
      case ChildTypeEnum.REGULAR:
        throw new BadRequestException(
          '일반 아동 유형은 더 이상 지원되지 않습니다. 시설에 연결된 아동만 등록 가능합니다.',
        );
      default:
        throw new BadRequestException('유효하지 않은 아동 유형입니다');
    }
  }

  /**
   * 양육시설 아동 검증
   * - careFacilityId 필수
   * - communityChildCenterId 없어야 함
   */
  private async validateCareFacilityChild(dto: RegisterChildDto): Promise<void> {
    if (!dto.careFacilityId) {
      throw new BadRequestException('양육시설 아동은 양육시설 ID가 필수입니다');
    }

    if (dto.communityChildCenterId) {
      throw new BadRequestException('양육시설 아동은 지역아동센터와 연결될 수 없습니다');
    }

    // 양육시설 존재 확인
    const facilityExists = await this.careFacilityRepository.exists(dto.careFacilityId);
    if (!facilityExists) {
      throw new NotFoundException(`양육시설을 찾을 수 없습니다: ${dto.careFacilityId}`);
    }
  }

  /**
   * 지역아동센터 아동 검증
   * - communityChildCenterId 필수
   * - careFacilityId 없어야 함
   */
  private async validateCommunityChildCenterChild(dto: RegisterChildDto): Promise<void> {
    if (dto.careFacilityId) {
      throw new BadRequestException('지역아동센터 아동은 양육시설과 연결될 수 없습니다');
    }

    if (!dto.communityChildCenterId) {
      throw new BadRequestException('지역아동센터 아동은 지역아동센터 ID가 필수입니다');
    }

    // 지역아동센터 존재 확인
    const centerExists = await this.communityChildCenterRepository.exists(
      dto.communityChildCenterId,
    );
    if (!centerExists) {
      throw new NotFoundException(`지역아동센터를 찾을 수 없습니다: ${dto.communityChildCenterId}`);
    }
  }

  /**
   * Infrastructure Enum → Domain Value
   */
  private mapChildTypeEnumToDomain(enumValue: ChildTypeEnum): ChildTypeValue {
    const mapping: Record<ChildTypeEnum, ChildTypeValue> = {
      [ChildTypeEnum.CARE_FACILITY]: ChildTypeValue.CARE_FACILITY,
      [ChildTypeEnum.COMMUNITY_CENTER]: ChildTypeValue.COMMUNITY_CENTER,
      [ChildTypeEnum.REGULAR]: ChildTypeValue.REGULAR,
    };
    return mapping[enumValue];
  }
}
