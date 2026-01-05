import { Inject, Injectable } from '@nestjs/common';
import { CommunityChildCenterRepository } from '@domain/community-child-center/repository/community-child-center.repository';
import { GuardianProfileRepository } from '@domain/guardian/repository/guardian-profile.repository';
import {
  CommunityChildCenterListResponseDto,
  CommunityChildCenterResponseDto,
} from '../dto/community-child-center-response.dto';

/**
 * 지역아동센터 목록 조회 유스케이스
 */
@Injectable()
export class GetCommunityChildCentersUseCase {
  constructor(
    @Inject('CommunityChildCenterRepository')
    private readonly communityChildCenterRepository: CommunityChildCenterRepository,
    @Inject('GuardianProfileRepository')
    private readonly guardianProfileRepository: GuardianProfileRepository,
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

    // 각 센터의 선생님 수를 조회
    const centers: CommunityChildCenterResponseDto[] = await Promise.all(
      data.map(async (center) => {
        const teacherCount = await this.guardianProfileRepository.countByCommunityChildCenterId(
          center.id,
        );

        return {
          id: center.id,
          name: center.name.value,
          address: center.address.address,
          addressDetail: center.address.addressDetail,
          postalCode: center.address.postalCode,
          representativeName: center.representativeName,
          phoneNumber: center.phoneNumber,
          capacity: center.capacity,
          establishedDate: center.establishedDate.toISOString().split('T')[0],
          introduction: center.introduction,
          operatingHours: center.operatingHours,
          isActive: center.isActive,
          teacherCount,
          createdAt: center.createdAt,
          updatedAt: center.updatedAt,
        };
      }),
    );

    return {
      centers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
