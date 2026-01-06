import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CounselorProfileEntity } from '@infrastructure/persistence/typeorm/entity/counselor-profile.entity';
import { UserEntity } from '@infrastructure/persistence/typeorm/entity/user.entity';
import { AdminUserDetailResponseDto } from './dto/admin-user-response.dto';

/**
 * Admin 사용자 상세 조회 Use Case
 */
@Injectable()
export class GetUserDetailAdminUseCase {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(CounselorProfileEntity)
    private readonly counselorProfileRepository: Repository<CounselorProfileEntity>,
  ) {}

  async execute(userId: string): Promise<AdminUserDetailResponseDto> {
    // 사용자 조회
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`사용자를 찾을 수 없습니다: ${userId}`);
    }

    // 기본 응답 구성
    const response: AdminUserDetailResponseDto = {
      id: user.id,
      email: user.email,
      realName: user.realName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      isBanned: user.isBanned || false,
      banReason: user.banReason ?? undefined,
      bannedAt: user.bannedAt ?? undefined,
      lastLoginAt: user.lastLoginAt ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // 역할별 추가 정보 조회
    if (user.role === 'COUNSELOR') {
      const counselorProfile = await this.counselorProfileRepository.findOne({
        where: { userId: user.id },
        relations: ['institution'],
      });

      if (counselorProfile) {
        response.counselorProfile = {
          id: counselorProfile.id,
          institutionId: counselorProfile.institution?.id || '',
          institutionName: counselorProfile.institution?.centerName || '',
          specializations: counselorProfile.specialties || [],
          isActive: true, // CounselorProfileEntity에 isActive 필드 없음 - 기본값 true
        };
      }
    }

    return response;
  }
}
