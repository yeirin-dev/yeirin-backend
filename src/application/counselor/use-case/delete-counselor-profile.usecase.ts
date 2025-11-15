import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CounselorProfileRepository } from '@domain/counselor/repository/counselor-profile.repository';

/**
 * 상담사 프로필 삭제 유스케이스
 */
@Injectable()
export class DeleteCounselorProfileUseCase {
  constructor(
    @Inject('CounselorProfileRepository')
    private readonly counselorProfileRepository: CounselorProfileRepository,
  ) {}

  async execute(id: string): Promise<void> {
    // 상담사 존재 확인
    const existing = await this.counselorProfileRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`상담사 프로필을 찾을 수 없습니다 (ID: ${id})`);
    }

    await this.counselorProfileRepository.delete(id);
  }
}
