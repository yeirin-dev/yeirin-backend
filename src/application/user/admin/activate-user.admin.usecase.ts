import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { UserRepository } from '@domain/user/repository/user.repository';

/**
 * Admin 사용자 활성화 Use Case
 */
@Injectable()
export class ActivateUserAdminUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string, _adminId?: string): Promise<void> {
    // 사용자 조회
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`사용자를 찾을 수 없습니다: ${userId}`);
    }

    // Domain 메서드 호출 (이미 존재)
    user.activate();

    // 저장
    await this.userRepository.save(user);
  }
}
