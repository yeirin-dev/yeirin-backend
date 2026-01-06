import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CareFacility } from '@domain/care-facility/model/care-facility';
import { CareFacilityRepository } from '@domain/care-facility/repository/care-facility.repository';
import { Address } from '@domain/common/value-objects/address.vo';
import { InstitutionName } from '@domain/common/value-objects/institution-name.vo';
import { CareFacilityResponseDto } from '../dto/care-facility-response.dto';
import { CreateCareFacilityDto } from '../dto/create-care-facility.dto';

/**
 * 양육시설 생성 유스케이스
 *
 * NOTE: Institution-based login으로 전환됨에 따라 개별 교사 계정 없이
 * 시설 자체가 로그인 주체가 됨. teacherCount는 항상 0.
 */
@Injectable()
export class CreateCareFacilityUseCase {
  constructor(
    @Inject('CareFacilityRepository')
    private readonly careFacilityRepository: CareFacilityRepository,
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

    // NOTE: Institution-based login으로 전환됨 - 개별 교사 계정 없음
    const teacherCount = 0;

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
