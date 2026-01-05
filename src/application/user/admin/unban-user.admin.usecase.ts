import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { UserRepository } from '@domain/user/repository/user.repository';

/**
 * Admin 사용자 정지 해제 Use Case
 */
@Injectable()
export class UnbanUserAdminUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    // 사용자 조회
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`사용자를 찾을 수 없습니다: ${userId}`);
    }

    // Domain에서 unban 메서드 호출 (Step 5에서 구현 예정)
    const result = user.unban();

    if (result.isFailure) {
      throw new BadRequestException(result.getError().message);
    }

    // 저장
    await this.userRepository.save(user);
  }
}
