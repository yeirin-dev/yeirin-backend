import { Inject, Injectable } from '@nestjs/common';
import { CareFacilityRepository } from '@domain/care-facility/repository/care-facility.repository';
import {
  CareFacilityListResponseDto,
  CareFacilityResponseDto,
} from '../dto/care-facility-response.dto';

/**
 * 양육시설 목록 조회 유스케이스
 *
 * NOTE: Institution-based login으로 전환됨 - 개별 교사 계정 없음
 */
@Injectable()
export class GetCareFacilitiesUseCase {
  constructor(
    @Inject('CareFacilityRepository')
    private readonly careFacilityRepository: CareFacilityRepository,
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

    // NOTE: Institution-based login으로 전환됨 - 개별 교사 계정 없음
    const facilities: CareFacilityResponseDto[] = data.map((facility) => {
      const teacherCount = 0;

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
    });

    return {
      facilities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
