import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { VoucherLinkageEntity } from '@infrastructure/persistence/typeorm/entity/voucher-linkage.entity';
import { S3Service } from '@infrastructure/storage/s3.service';
import { AdminPaginatedResponseDto } from '@yeirin/admin-common';
import { AdminCounselRequestQueryDto } from './dto/admin-counsel-request-query.dto';
import { AdminCounselRequestResponseDto } from './dto/admin-counsel-request-response.dto';
import { VoucherLinkageStatus as DomainVoucherLinkageStatus } from '@domain/voucher-linkage/model/voucher-linkage';
import { VoucherLinkageStatus as EntityVoucherLinkageStatus } from '@infrastructure/persistence/typeorm/entity/enums/voucher-linkage-status.enum';

/**
 * Admin 상담의뢰 목록 조회 Use Case
 */
@Injectable()
export class GetCounselRequestsAdminUseCase {
  constructor(
    @InjectRepository(CounselRequestEntity)
    private readonly counselRequestRepository: Repository<CounselRequestEntity>,
    private readonly s3Service: S3Service,
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
      isVoucherEligible,
      voucherLinkageStatus,
    } = query;

    // 쿼리 빌더 - VoucherLinkage LEFT JOIN 추가
    const queryBuilder = this.counselRequestRepository
      .createQueryBuilder('cr')
      .leftJoinAndSelect('cr.child', 'child')
      .leftJoinAndMapOne(
        'cr.voucherLinkage',
        VoucherLinkageEntity,
        'vl',
        'vl.counselRequestId = cr.id',
      );

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

    // 바우처 추천대상 필터
    if (isVoucherEligible !== undefined) {
      queryBuilder.andWhere('cr.isVoucherEligible = :isVoucherEligible', { isVoucherEligible });
    }

    // 바우처 연계 상태 필터
    if (voucherLinkageStatus) {
      const entityStatus = this.toEntityVoucherLinkageStatus(voucherLinkageStatus);
      queryBuilder.andWhere('vl.status = :voucherLinkageStatus', {
        voucherLinkageStatus: entityStatus,
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

    // DTO 변환 (presigned URL 생성 포함)
    const data = await Promise.all(
      counselRequests.map((cr) => this.toResponseDto(cr)),
    );

    return AdminPaginatedResponseDto.of(data, total, page, limit);
  }

  private async toResponseDto(
    cr: CounselRequestEntity & { voucherLinkage?: VoucherLinkageEntity },
  ): Promise<AdminCounselRequestResponseDto> {
    // 통합보고서 presigned URL 생성
    let integratedReportUrl: string | undefined;
    if (cr.integratedReportS3Key && cr.integratedReportStatus === 'completed') {
      try {
        integratedReportUrl = await this.s3Service.getPresignedUrl(
          cr.integratedReportS3Key,
          3600, // 1시간
        );
      } catch {
        // URL 생성 실패 시 undefined 유지
      }
    }

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
      isVoucherEligible: cr.isVoucherEligible,
      voucherEligibilityReasons: cr.voucherEligibilityReasons,
      voucherLinkageStatus: cr.voucherLinkage
        ? this.toDomainVoucherLinkageStatus(cr.voucherLinkage.status)
        : undefined,
      voucherLinkedAt: cr.voucherLinkage?.linkedAt,
      integratedReportS3Key: cr.integratedReportS3Key,
      integratedReportStatus: cr.integratedReportStatus,
      integratedReportUrl,
      createdAt: cr.createdAt,
      updatedAt: cr.updatedAt,
    };
  }

  /**
   * Domain VoucherLinkageStatus → Entity VoucherLinkageStatus
   */
  private toEntityVoucherLinkageStatus(
    domainStatus: DomainVoucherLinkageStatus,
  ): EntityVoucherLinkageStatus {
    switch (domainStatus) {
      case DomainVoucherLinkageStatus.PENDING:
        return EntityVoucherLinkageStatus.PENDING;
      case DomainVoucherLinkageStatus.COMPLETED:
        return EntityVoucherLinkageStatus.COMPLETED;
      default:
        return EntityVoucherLinkageStatus.PENDING;
    }
  }

  /**
   * Entity VoucherLinkageStatus → Domain VoucherLinkageStatus
   */
  private toDomainVoucherLinkageStatus(
    entityStatus: EntityVoucherLinkageStatus,
  ): DomainVoucherLinkageStatus {
    switch (entityStatus) {
      case EntityVoucherLinkageStatus.PENDING:
        return DomainVoucherLinkageStatus.PENDING;
      case EntityVoucherLinkageStatus.COMPLETED:
        return DomainVoucherLinkageStatus.COMPLETED;
      default:
        return DomainVoucherLinkageStatus.PENDING;
    }
  }
}
