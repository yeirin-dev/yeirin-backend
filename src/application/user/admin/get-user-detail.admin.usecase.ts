import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { CounselorProfileEntity } from '@infrastructure/persistence/typeorm/entity/counselor-profile.entity';
import { GuardianProfileEntity } from '@infrastructure/persistence/typeorm/entity/guardian-profile.entity';
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
    @InjectRepository(GuardianProfileEntity)
    private readonly guardianProfileRepository: Repository<GuardianProfileEntity>,
    @InjectRepository(CounselorProfileEntity)
    private readonly counselorProfileRepository: Repository<CounselorProfileEntity>,
    @InjectRepository(CounselRequestEntity)
    private readonly counselRequestRepository: Repository<CounselRequestEntity>,
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
    if (user.role === 'GUARDIAN') {
      const guardianProfile = await this.guardianProfileRepository.findOne({
        where: { userId: user.id },
        relations: ['careFacility', 'communityChildCenter'],
      });

      if (guardianProfile) {
        // 자녀 수 조회
        const childrenCount = await this.guardianProfileRepository
          .createQueryBuilder('gp')
          .leftJoin('gp.children', 'children')
          .where('gp.id = :id', { id: guardianProfile.id })
          .select('COUNT(children.id)', 'count')
          .getRawOne();

        response.guardianProfile = {
          id: guardianProfile.id,
          careFacilityId: guardianProfile.careFacility?.id,
          careFacilityName: guardianProfile.careFacility?.name,
          communityChildCenterId: guardianProfile.communityChildCenter?.id,
          communityChildCenterName: guardianProfile.communityChildCenter?.name,
          childrenCount: parseInt(childrenCount?.count || '0', 10),
        };

        // 활동 요약 조회
        const activitySummary = await this.getCounselRequestSummaryByGuardian(guardianProfile.id);
        response.activitySummary = activitySummary;
      }
    } else if (user.role === 'COUNSELOR') {
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

  private async getCounselRequestSummaryByGuardian(guardianProfileId: string): Promise<{
    totalCounselRequests: number;
    activeCounselRequests: number;
    completedCounselRequests: number;
    lastActivityAt?: Date;
  }> {
    const result = await this.counselRequestRepository
      .createQueryBuilder('cr')
      .where('cr.guardianId = :guardianId', { guardianId: guardianProfileId })
      .select([
        'COUNT(*) as total',
        "COUNT(CASE WHEN cr.status IN ('PENDING', 'RECOMMENDED', 'MATCHED', 'IN_PROGRESS') THEN 1 END) as active",
        "COUNT(CASE WHEN cr.status = 'COMPLETED' THEN 1 END) as completed",
        'MAX(cr.updatedAt) as lastActivity',
      ])
      .getRawOne();

    return {
      totalCounselRequests: parseInt(result?.total || '0', 10),
      activeCounselRequests: parseInt(result?.active || '0', 10),
      completedCounselRequests: parseInt(result?.completed || '0', 10),
      lastActivityAt: result?.lastActivity ? new Date(result.lastActivity) : undefined,
    };
  }
}
