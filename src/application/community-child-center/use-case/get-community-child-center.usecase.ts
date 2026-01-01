import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CommunityChildCenterRepository } from '@domain/community-child-center/repository/community-child-center.repository';
import { GuardianProfileRepository } from '@domain/guardian/repository/guardian-profile.repository';
import { CommunityChildCenterResponseDto } from '../dto/community-child-center-response.dto';

/**
 * 지역아동센터 단건 조회 유스케이스
 */
@Injectable()
export class GetCommunityChildCenterUseCase {
  constructor(
    @Inject('CommunityChildCenterRepository')
    private readonly communityChildCenterRepository: CommunityChildCenterRepository,
    @Inject('GuardianProfileRepository')
    private readonly guardianProfileRepository: GuardianProfileRepository,
  ) {}

  async execute(id: string): Promise<CommunityChildCenterResponseDto> {
    const center = await this.communityChildCenterRepository.findById(id);

    if (!center) {
      throw new NotFoundException(`지역아동센터를 찾을 수 없습니다 (ID: ${id})`);
    }

    // 소속 선생님 수 조회
    const teacherCount = await this.guardianProfileRepository.countByCommunityChildCenterId(id);

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
  }
}
