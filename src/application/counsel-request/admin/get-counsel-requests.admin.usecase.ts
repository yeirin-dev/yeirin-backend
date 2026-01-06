import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { AdminPaginatedResponseDto } from '@yeirin/admin-common';
import { AdminCounselRequestQueryDto } from './dto/admin-counsel-request-query.dto';
import { AdminCounselRequestResponseDto } from './dto/admin-counsel-request-response.dto';

/**
 * Admin 상담의뢰 목록 조회 Use Case
 */
@Injectable()
export class GetCounselRequestsAdminUseCase {
  constructor(
    @InjectRepository(CounselRequestEntity)
    private readonly counselRequestRepository: Repository<CounselRequestEntity>,
  ) {}

  async execute(
    query: AdminCounselRequestQueryDto,
  ): Promise<AdminPaginatedResponseDto<AdminCounselRequestResponseDto>> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      careType,
      institutionId,
      counselorId,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = query;

    // 쿼리 빌더
    const queryBuilder = this.counselRequestRepository
      .createQueryBuilder('cr')
      .leftJoinAndSelect('cr.child', 'child');

    // 상태 필터
    if (status) {
      queryBuilder.andWhere('cr.status = :status', { status });
    }

    // 돌봄 유형 필터
    if (careType) {
      queryBuilder.andWhere('cr.careType = :careType', { careType });
    }

    // 기관 ID 필터
    if (institutionId) {
      queryBuilder.andWhere('cr.matchedInstitutionId = :institutionId', { institutionId });
    }

    // 상담사 ID 필터
    if (counselorId) {
      queryBuilder.andWhere('cr.matchedCounselorId = :counselorId', { counselorId });
    }

    // 날짜 범위 필터
    if (startDate && endDate) {
      queryBuilder.andWhere('cr.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    // 검색어 필터
    if (search) {
      queryBuilder.andWhere('(cr.centerName ILIKE :search OR child.name ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    // 정렬
    const orderField = sortBy || 'createdAt';
    const orderDirection = sortOrder || 'DESC';
    queryBuilder.orderBy(`cr.${orderField}`, orderDirection);

    // 페이지네이션
    queryBuilder.skip((page - 1) * limit).take(limit);

    // 쿼리 실행
    const [counselRequests, total] = await queryBuilder.getManyAndCount();

    // DTO 변환
    const data = counselRequests.map((cr) => this.toResponseDto(cr));

    return AdminPaginatedResponseDto.of(data, total, page, limit);
  }

  private toResponseDto(cr: CounselRequestEntity): AdminCounselRequestResponseDto {
    return {
      id: cr.id,
      childId: cr.childId,
      childName: cr.child?.name || '',
      status: cr.status,
      centerName: cr.centerName,
      careType: cr.careType,
      requestDate: cr.requestDate,
      matchedInstitutionId: cr.matchedInstitutionId,
      matchedInstitutionName: undefined, // TODO: Institution 조회 추가 필요시 구현
      matchedCounselorId: cr.matchedCounselorId,
      matchedCounselorName: undefined, // TODO: Counselor 조회 추가 필요시 구현
      createdAt: cr.createdAt,
      updatedAt: cr.updatedAt,
    };
  }
}
