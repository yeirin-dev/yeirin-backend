import { Inject, Injectable } from '@nestjs/common';
import { CareFacilityRepository } from '@domain/care-facility/repository/care-facility.repository';
import { GuardianProfileRepository } from '@domain/guardian/repository/guardian-profile.repository';
import {
  CareFacilityListResponseDto,
  CareFacilityResponseDto,
} from '../dto/care-facility-response.dto';

/**
 * 양육시설 목록 조회 유스케이스
 */
@Injectable()
export class GetCareFacilitiesUseCase {
  constructor(
    @Inject('CareFacilityRepository')
    private readonly careFacilityRepository: CareFacilityRepository,
    @Inject('GuardianProfileRepository')
    private readonly guardianProfileRepository: GuardianProfileRepository,
  ) {}

  async execute(
    page: number = 1,
    limit: number = 10,
    isActive?: boolean,
  ): Promise<CareFacilityListResponseDto> {
    const { data, total } = await this.careFacilityRepository.findAll({
      page,
      limit,
      isActive,
    });

    // 각 시설의 선생님 수를 조회
    const facilities: CareFacilityResponseDto[] = await Promise.all(
      data.map(async (facility) => {
        const teacherCount = await this.guardianProfileRepository.countByCareFacilityId(
          facility.id,
        );

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
      }),
    );

    return {
      facilities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
