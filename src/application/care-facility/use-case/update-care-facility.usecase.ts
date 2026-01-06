import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CareFacilityRepository } from '@domain/care-facility/repository/care-facility.repository';
import { Address } from '@domain/common/value-objects/address.vo';
import { InstitutionName } from '@domain/common/value-objects/institution-name.vo';
import { CareFacilityResponseDto } from '../dto/care-facility-response.dto';
import { UpdateCareFacilityDto } from '../dto/update-care-facility.dto';

/**
 * 양육시설 수정 유스케이스
 *
 * NOTE: Institution-based login으로 전환됨 - 개별 교사 계정 없음
 */
@Injectable()
export class UpdateCareFacilityUseCase {
  constructor(
    @Inject('CareFacilityRepository')
    private readonly careFacilityRepository: CareFacilityRepository,
  ) {}

  async execute(id: string, dto: UpdateCareFacilityDto): Promise<CareFacilityResponseDto> {
    const facility = await this.careFacilityRepository.findById(id);

    if (!facility) {
      throw new NotFoundException(`양육시설을 찾을 수 없습니다 (ID: ${id})`);
    }

    // 기관명 변경
    if (dto.name !== undefined) {
      // 중복 확인 (자기 자신 제외)
      const existingFacility = await this.careFacilityRepository.findByName(dto.name);
      if (existingFacility && existingFacility.id !== id) {
        throw new BadRequestException(`이미 존재하는 기관명입니다: ${dto.name}`);
      }

      const nameResult = InstitutionName.create(dto.name);
      if (nameResult.isFailure) {
        throw new BadRequestException(nameResult.getError().message);
      }
      facility.changeName(nameResult.getValue());
    }

    // 주소 변경
    if (
      dto.address !== undefined ||
      dto.addressDetail !== undefined ||
      dto.postalCode !== undefined
    ) {
      const addressResult = Address.create({
        address: dto.address ?? facility.address.address,
        addressDetail: dto.addressDetail ?? facility.address.addressDetail ?? undefined,
        postalCode: dto.postalCode ?? facility.address.postalCode ?? undefined,
      });
      if (addressResult.isFailure) {
        throw new BadRequestException(addressResult.getError().message);
      }
      facility.changeAddress(addressResult.getValue());
    }

    // 대표자 정보 변경
    if (dto.representativeName !== undefined || dto.phoneNumber !== undefined) {
      const result = facility.changeRepresentative(
        dto.representativeName ?? facility.representativeName,
        dto.phoneNumber ?? facility.phoneNumber,
      );
      if (result.isFailure) {
        throw new BadRequestException(result.getError().message);
      }
    }

    // 정원 변경
    if (dto.capacity !== undefined) {
      const result = facility.changeCapacity(dto.capacity);
      if (result.isFailure) {
        throw new BadRequestException(result.getError().message);
      }
    }

    // 소개 변경
    if (dto.introduction !== undefined) {
      const result = facility.changeIntroduction(dto.introduction);
      if (result.isFailure) {
        throw new BadRequestException(result.getError().message);
      }
    }

    // 활성화 상태 변경
    if (dto.isActive !== undefined) {
      if (dto.isActive) {
        facility.activate();
      } else {
        facility.deactivate();
      }
    }

    // 저장
    const savedFacility = await this.careFacilityRepository.save(facility);

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
