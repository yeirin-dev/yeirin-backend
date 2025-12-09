import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { UserRepository } from '@domain/user/repository/user.repository';
import { AdminBanUserDto } from './dto/admin-ban-user.dto';

/**
 * Admin 사용자 정지 Use Case
 *
 * 비즈니스 규칙:
 * - ADMIN 역할 사용자는 정지 불가
 * - 이미 정지된 사용자는 다시 정지 불가
 * - 정지 사유는 필수
 */
@Injectable()
export class BanUserAdminUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string, dto: AdminBanUserDto, _adminId?: string): Promise<void> {
    // 사용자 조회
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`사용자를 찾을 수 없습니다: ${userId}`);
    }

    // ADMIN 역할 정지 불가
    if (user.role.value === 'ADMIN') {
      throw new BadRequestException('관리자 계정은 정지할 수 없습니다');
    }

    // Domain에서 ban 메서드 호출 (Step 5에서 구현 예정)
    const result = user.ban(dto.reason);

    if (result.isFailure) {
      throw new BadRequestException(result.getError().message);
    }

    // 저장
    await this.userRepository.save(user);
  }
}
