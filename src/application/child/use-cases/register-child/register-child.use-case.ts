import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CareFacilityRepository } from '@domain/care-facility/repository/care-facility.repository';
import { Child } from '@domain/child/model/child';
import { BirthDate } from '@domain/child/model/value-objects/birth-date.vo';
import { ChildName } from '@domain/child/model/value-objects/child-name.vo';
import { ChildType, ChildTypeValue } from '@domain/child/model/value-objects/child-type.vo';
import { Gender } from '@domain/child/model/value-objects/gender.vo';
import { ChildRepository } from '@domain/child/repository/child.repository';
import { CommunityChildCenterRepository } from '@domain/community-child-center/repository/community-child-center.repository';
import { GuardianProfileRepository } from '@domain/guardian/repository/guardian-profile.repository';
import { ChildType as ChildTypeEnum } from '@infrastructure/persistence/typeorm/entity/enums/child-type.enum';
import { ChildResponseDto } from '../../dto/child-response.dto';
import { RegisterChildDto } from '../../dto/register-child.dto';

/**
 * 아동 등록 Use Case
 *
 * 아동 유형별 관계 비즈니스 규칙:
 * - CARE_FACILITY (양육시설 아동): careFacilityId 필수
 * - COMMUNITY_CENTER (지역아동센터 아동): communityChildCenterId + guardianId 필수
 * - REGULAR (일반 아동): guardianId 필수
 */
@Injectable()
export class RegisterChildUseCase {
  constructor(
    @Inject('ChildRepository')
    private readonly childRepository: ChildRepository,
    @Inject('GuardianProfileRepository')
    private readonly guardianRepository: GuardianProfileRepository,
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
      guardianId: dto.guardianId ?? null,
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
        await this.validateRegularChild(dto);
        break;
      default:
        throw new BadRequestException('유효하지 않은 아동 유형입니다');
    }
  }

  /**
   * 양육시설 아동 (고아) 검증
   * - careFacilityId 필수
   * - communityChildCenterId, guardianId 없어야 함
   */
  private async validateCareFacilityChild(dto: RegisterChildDto): Promise<void> {
    if (!dto.careFacilityId) {
      throw new BadRequestException('양육시설 아동은 양육시설 ID가 필수입니다');
    }

    if (dto.communityChildCenterId) {
      throw new BadRequestException('양육시설 아동은 지역아동센터와 연결될 수 없습니다');
    }

    if (dto.guardianId) {
      throw new BadRequestException('양육시설 아동(고아)은 부모 보호자와 연결될 수 없습니다');
    }

    // 양육시설 존재 확인
    const facilityExists = await this.careFacilityRepository.exists(dto.careFacilityId);
    if (!facilityExists) {
      throw new NotFoundException(`양육시설을 찾을 수 없습니다: ${dto.careFacilityId}`);
    }
  }

  /**
   * 지역아동센터 아동 검증
   * - communityChildCenterId + guardianId 필수
   * - careFacilityId 없어야 함
   */
  private async validateCommunityChildCenterChild(dto: RegisterChildDto): Promise<void> {
    if (dto.careFacilityId) {
      throw new BadRequestException('지역아동센터 아동은 양육시설과 연결될 수 없습니다');
    }

    if (!dto.communityChildCenterId) {
      throw new BadRequestException('지역아동센터 아동은 지역아동센터 ID가 필수입니다');
    }

    if (!dto.guardianId) {
      throw new BadRequestException('지역아동센터 아동은 부모 보호자 ID가 필수입니다');
    }

    // 지역아동센터 존재 확인
    const centerExists = await this.communityChildCenterRepository.exists(
      dto.communityChildCenterId,
    );
    if (!centerExists) {
      throw new NotFoundException(`지역아동센터를 찾을 수 없습니다: ${dto.communityChildCenterId}`);
    }

    // 부모 보호자 존재 확인
    const guardianExists = await this.guardianRepository.exists(dto.guardianId);
    if (!guardianExists) {
      throw new NotFoundException(`보호자를 찾을 수 없습니다: ${dto.guardianId}`);
    }
  }

  /**
   * 일반 아동 (부모 직접보호) 검증
   * - guardianId 필수
   * - careFacilityId, communityChildCenterId 없어야 함
   */
  private async validateRegularChild(dto: RegisterChildDto): Promise<void> {
    if (dto.careFacilityId) {
      throw new BadRequestException('일반 아동은 양육시설과 연결될 수 없습니다');
    }

    if (dto.communityChildCenterId) {
      throw new BadRequestException('일반 아동은 지역아동센터와 연결될 수 없습니다');
    }

    if (!dto.guardianId) {
      throw new BadRequestException('일반 아동은 부모 보호자 ID가 필수입니다');
    }

    // 부모 보호자 존재 확인
    const guardianExists = await this.guardianRepository.exists(dto.guardianId);
    if (!guardianExists) {
      throw new NotFoundException(`보호자를 찾을 수 없습니다: ${dto.guardianId}`);
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
