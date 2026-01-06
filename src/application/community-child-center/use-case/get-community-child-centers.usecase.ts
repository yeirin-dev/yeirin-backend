import { Inject, Injectable } from '@nestjs/common';
import { CommunityChildCenterRepository } from '@domain/community-child-center/repository/community-child-center.repository';
import {
  CommunityChildCenterListResponseDto,
  CommunityChildCenterResponseDto,
} from '../dto/community-child-center-response.dto';

/**
 * 지역아동센터 목록 조회 유스케이스
 *
 * NOTE: Institution-based login으로 전환됨 - 개별 교사 계정 없음
 */
@Injectable()
export class GetCommunityChildCentersUseCase {
  constructor(
    @Inject('CommunityChildCenterRepository')
    private readonly communityChildCenterRepository: CommunityChildCenterRepository,
  ) {}

  async execute(
    page: number = 1,
    limit: number = 10,
    isActive?: boolean,
  ): Promise<CommunityChildCenterListResponseDto> {
    const { data, total } = await this.communityChildCenterRepository.findAll({
      page,
      limit,
      isActive,
    });

    // NOTE: Institution-based login으로 전환됨 - 개별 교사 계정 없음
    const centers: CommunityChildCenterResponseDto[] = data.map((center) => {
      const teacherCount = 0;

      return {
        id: center.id,
        name: center.name.value,
        address: center.address.address,
        addressDetail: center.address.addressDetail,
        postalCode: center.address.postalCode,
        directorName: center.directorName,
        phoneNumber: center.phoneNumber,
        capacity: center.capacity,
        establishedDate: center.establishedDate?.toISOString().split('T')[0] ?? null,
        introduction: center.introduction,
        operatingHours: center.operatingHours,
        isActive: center.isActive,
        teacherCount,
        createdAt: center.createdAt,
        updatedAt: center.updatedAt,
      };
    });

    return {
      centers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
