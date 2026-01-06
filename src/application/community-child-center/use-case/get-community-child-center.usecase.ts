import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CommunityChildCenterRepository } from '@domain/community-child-center/repository/community-child-center.repository';
import { CommunityChildCenterResponseDto } from '../dto/community-child-center-response.dto';

/**
 * 지역아동센터 단건 조회 유스케이스
 *
 * NOTE: Institution-based login으로 전환됨 - 개별 교사 계정 없음
 */
@Injectable()
export class GetCommunityChildCenterUseCase {
  constructor(
    @Inject('CommunityChildCenterRepository')
    private readonly communityChildCenterRepository: CommunityChildCenterRepository,
  ) {}

  async execute(id: string): Promise<CommunityChildCenterResponseDto> {
    const center = await this.communityChildCenterRepository.findById(id);

    if (!center) {
      throw new NotFoundException(`지역아동센터를 찾을 수 없습니다 (ID: ${id})`);
    }

    // NOTE: Institution-based login으로 전환됨 - 개별 교사 계정 없음
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
  }
}
