import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CareFacilityRepository } from '@domain/care-facility/repository/care-facility.repository';
import { GuardianProfileRepository } from '@domain/guardian/repository/guardian-profile.repository';
import { CareFacilityResponseDto } from '../dto/care-facility-response.dto';

/**
 * 양육시설 단건 조회 유스케이스
 */
@Injectable()
export class GetCareFacilityUseCase {
  constructor(
    @Inject('CareFacilityRepository')
    private readonly careFacilityRepository: CareFacilityRepository,
    @Inject('GuardianProfileRepository')
    private readonly guardianProfileRepository: GuardianProfileRepository,
  ) {}

  async execute(id: string): Promise<CareFacilityResponseDto> {
    const facility = await this.careFacilityRepository.findById(id);

    if (!facility) {
      throw new NotFoundException(`양육시설을 찾을 수 없습니다 (ID: ${id})`);
    }

    // 소속 선생님 수 조회
    const teacherCount = await this.guardianProfileRepository.countByCareFacilityId(id);

    return {
      id: facility.id,
      name: facility.name.value,
      address: facility.address.address,
      addressDetail: facility.address.addressDetail,
      postalCode: facility.address.postalCode,
      representativeName: facility.representativeName,
      phoneNumber: facility.phoneNumber,
      capacity: facility.capacity,
      establishedDate: facility.establishedDate.toISOString().split('T')[0],
      introduction: facility.introduction,
      isActive: facility.isActive,
      teacherCount,
      createdAt: facility.createdAt,
      updatedAt: facility.updatedAt,
    };
  }
}
