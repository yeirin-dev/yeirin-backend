import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { UserRepository } from '@domain/user/repository/user.repository';

/**
 * Admin 사용자 비활성화 Use Case
 *
 * 비즈니스 규칙:
 * - ADMIN 역할 사용자는 비활성화 불가
 */
@Injectable()
export class DeactivateUserAdminUseCase {
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

    // ADMIN 역할 비활성화 불가
    if (user.role.value === 'ADMIN') {
      throw new BadRequestException('관리자 계정은 비활성화할 수 없습니다');
    }

    // Domain 메서드 호출 (이미 존재)
    user.deactivate();

    // 저장
    await this.userRepository.save(user);
  }
}
