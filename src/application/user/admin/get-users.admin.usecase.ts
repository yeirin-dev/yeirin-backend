import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { UserEntity } from '@infrastructure/persistence/typeorm/entity/user.entity';
import { AdminPaginatedResponseDto } from '@yeirin/admin-common';
import { AdminUserQueryDto, UserStatusFilter } from './dto/admin-user-query.dto';
import { AdminUserResponseDto } from './dto/admin-user-response.dto';

/**
 * Admin 사용자 목록 조회 Use Case
 */
@Injectable()
export class GetUsersAdminUseCase {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(
    query: AdminUserQueryDto,
  ): Promise<AdminPaginatedResponseDto<AdminUserResponseDto>> {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      status,
      isEmailVerified,
      sortBy,
      sortOrder,
    } = query;

    // 필터 조건 구성
    const where: FindOptionsWhere<UserEntity> = {};

    if (role) {
      where.role = role;
    }

    if (isEmailVerified !== undefined) {
      where.isEmailVerified = isEmailVerified;
    }

    // 상태 필터
    if (status === UserStatusFilter.ACTIVE) {
      where.isActive = true;
      where.isBanned = false;
    } else if (status === UserStatusFilter.INACTIVE) {
      where.isActive = false;
    } else if (status === UserStatusFilter.BANNED) {
      where.isBanned = true;
    }

    // 검색 쿼리 빌더
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // 역할 필터
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    // 상태 필터
    if (status === UserStatusFilter.ACTIVE) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: true });
      queryBuilder.andWhere('user.isBanned = :isBanned', { isBanned: false });
    } else if (status === UserStatusFilter.INACTIVE) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: false });
    } else if (status === UserStatusFilter.BANNED) {
      queryBuilder.andWhere('user.isBanned = :isBanned', { isBanned: true });
    }

    // 이메일 인증 필터
    if (isEmailVerified !== undefined) {
      queryBuilder.andWhere('user.isEmailVerified = :isEmailVerified', { isEmailVerified });
    }

    // 검색어 필터
    if (search) {
      queryBuilder.andWhere('(user.email ILIKE :search OR user.realName ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    // 정렬
    const orderField = sortBy || 'createdAt';
    const orderDirection = sortOrder || 'DESC';
    queryBuilder.orderBy(`user.${orderField}`, orderDirection);

    // 페이지네이션
    queryBuilder.skip((page - 1) * limit).take(limit);

    // 쿼리 실행
    const [users, total] = await queryBuilder.getManyAndCount();

    // DTO 변환
    const data = users.map((user) => this.toResponseDto(user));

    return AdminPaginatedResponseDto.of(data, total, page, limit);
  }

  private toResponseDto(user: UserEntity): AdminUserResponseDto {
    return {
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
  }
}
