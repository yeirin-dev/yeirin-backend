import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CommunityChildCenterRepository } from '@domain/community-child-center/repository/community-child-center.repository';

/**
 * 지역아동센터 삭제 유스케이스
 */
@Injectable()
export class DeleteCommunityChildCenterUseCase {
  constructor(
    @Inject('CommunityChildCenterRepository')
    private readonly communityChildCenterRepository: CommunityChildCenterRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const exists = await this.communityChildCenterRepository.exists(id);

    if (!exists) {
      throw new NotFoundException(`지역아동센터를 찾을 수 없습니다 (ID: ${id})`);
    }

    await this.communityChildCenterRepository.delete(id);
  }
}
