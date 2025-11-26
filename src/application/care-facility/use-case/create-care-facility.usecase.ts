import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CareFacility } from '@domain/care-facility/model/care-facility';
import { CareFacilityRepository } from '@domain/care-facility/repository/care-facility.repository';
import { Address } from '@domain/common/value-objects/address.vo';
import { InstitutionName } from '@domain/common/value-objects/institution-name.vo';
import { GuardianProfileRepository } from '@domain/guardian/repository/guardian-profile.repository';
import { CareFacilityResponseDto } from '../dto/care-facility-response.dto';
import { CreateCareFacilityDto } from '../dto/create-care-facility.dto';

/**
 * 양육시설 생성 유스케이스
 */
@Injectable()
export class CreateCareFacilityUseCase {
  constructor(
    @Inject('CareFacilityRepository')
    private readonly careFacilityRepository: CareFacilityRepository,
    @Inject('GuardianProfileRepository')
    private readonly guardianProfileRepository: GuardianProfileRepository,
  ) {}

  async execute(dto: CreateCareFacilityDto): Promise<CareFacilityResponseDto> {
    // 기관명 중복 확인
    const exists = await this.careFacilityRepository.existsByName(dto.name);
    if (exists) {
      throw new BadRequestException(`이미 존재하는 기관명입니다: ${dto.name}`);
    }

    // 기관명 Value Object 생성
    const nameResult = InstitutionName.create(dto.name);
    if (nameResult.isFailure) {
      throw new BadRequestException(nameResult.getError().message);
    }

    // 주소 Value Object 생성
    const addressResult = Address.create({
      address: dto.address,
      addressDetail: dto.addressDetail,
      postalCode: dto.postalCode,
    });
    if (addressResult.isFailure) {
      throw new BadRequestException(addressResult.getError().message);
    }

    // 도메인 모델 생성
    const facilityResult = CareFacility.create({
      name: nameResult.getValue(),
      address: addressResult.getValue(),
      representativeName: dto.representativeName,
      phoneNumber: dto.phoneNumber,
      capacity: dto.capacity,
      establishedDate: new Date(dto.establishedDate),
      introduction: dto.introduction,
    });

    if (facilityResult.isFailure) {
      throw new BadRequestException(facilityResult.getError().message);
    }

    // 저장
    const savedFacility = await this.careFacilityRepository.save(facilityResult.getValue());

    // 선생님 수 (새로 생성한 시설은 0)
    const teacherCount = await this.guardianProfileRepository.countByCareFacilityId(
      savedFacility.id,
    );

    return {
      id: savedFacility.id,
      name: savedFacility.name.value,
      address: savedFacility.address.address,
      addressDetail: savedFacility.address.addressDetail,
      postalCode: savedFacility.address.postalCode,
      representativeName: savedFacility.representativeName,
      phoneNumber: savedFacility.phoneNumber,
      capacity: savedFacility.capacity,
      establishedDate: savedFacility.establishedDate.toISOString().split('T')[0],
      introduction: savedFacility.introduction,
      isActive: savedFacility.isActive,
      teacherCount,
      createdAt: savedFacility.createdAt,
      updatedAt: savedFacility.updatedAt,
    };
  }
}
