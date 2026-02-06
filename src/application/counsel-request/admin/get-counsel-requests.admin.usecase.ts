import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { VoucherLinkageEntity } from '@infrastructure/persistence/typeorm/entity/voucher-linkage.entity';
import { CareFacilityEntity } from '@infrastructure/persistence/typeorm/entity/care-facility.entity';
import { CommunityChildCenterEntity } from '@infrastructure/persistence/typeorm/entity/community-child-center.entity';
import { EducationWelfareSchoolEntity } from '@infrastructure/persistence/typeorm/entity/education-welfare-school.entity';
import { S3Service } from '@infrastructure/storage/s3.service';
import { AdminPaginatedResponseDto } from '@yeirin/admin-common';
import { AdminCounselRequestQueryDto } from './dto/admin-counsel-request-query.dto';
import { AdminCounselRequestResponseDto } from './dto/admin-counsel-request-response.dto';
import { VoucherLinkageStatus as DomainVoucherLinkageStatus } from '@domain/voucher-linkage/model/voucher-linkage';
import { VoucherLinkageStatus as EntityVoucherLinkageStatus } from '@infrastructure/persistence/typeorm/entity/enums/voucher-linkage-status.enum';
import { ChildType } from '@infrastructure/persistence/typeorm/entity/enums/child-type.enum';

/**
 * Admin 상담의뢰 목록 조회 Use Case
 */
@Injectable()
export class GetCounselRequestsAdminUseCase {
  constructor(
    @InjectRepository(CounselRequestEntity)
    private readonly counselRequestRepository: Repository<CounselRequestEntity>,
    @InjectRepository(CareFacilityEntity)
    private readonly careFacilityRepository: Repository<CareFacilityEntity>,
    @InjectRepository(CommunityChildCenterEntity)
    private readonly communityChildCenterRepository: Repository<CommunityChildCenterEntity>,
    @InjectRepository(EducationWelfareSchoolEntity)
    private readonly educationWelfareSchoolRepository: Repository<EducationWelfareSchoolEntity>,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * 구/군 목록 조회
   */
  async getDistricts(): Promise<string[]> {
    // CareFacility 구/군 조회
    const careFacilityDistricts = await this.careFacilityRepository
      .createQueryBuilder('facility')
      .select('DISTINCT facility.district', 'district')
      .where('facility.isActive = :isActive', { isActive: true })
      .getRawMany<{ district: string }>();

    // CommunityChildCenter 구/군 조회
    const communityChildCenterDistricts = await this.communityChildCenterRepository
      .createQueryBuilder('center')
      .select('DISTINCT center.district', 'district')
      .where('center.isActive = :isActive', { isActive: true })
      .getRawMany<{ district: string }>();

    // EducationWelfareSchool 구/군 조회
    const educationWelfareSchoolDistricts = await this.educationWelfareSchoolRepository
      .createQueryBuilder('school')
      .select('DISTINCT school.district', 'district')
      .where('school.isActive = :isActive', { isActive: true })
      .getRawMany<{ district: string }>();

    // 중복 제거 및 정렬
    const allDistricts = new Set<string>();
    careFacilityDistricts.forEach((r) => allDistricts.add(r.district));
    communityChildCenterDistricts.forEach((r) => allDistricts.add(r.district));
    educationWelfareSchoolDistricts.forEach((r) => allDistricts.add(r.district));

    return Array.from(allDistricts).sort();
  }

  async execute(
    query: AdminCounselRequestQueryDto,
  ): Promise<AdminPaginatedResponseDto<AdminCounselRequestResponseDto>> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      careType,
      childType,
      institutionId,
      counselorId,
      startDate,
      endDate,
      sortBy,
      sortOrder,
      isVoucherEligible,
      voucherLinkageStatus,
      district,
    } = query;

    // 쿼리 빌더 - VoucherLinkage LEFT JOIN 및 기관 LEFT JOIN 추가
    const queryBuilder = this.counselRequestRepository
      .createQueryBuilder('cr')
      .leftJoinAndSelect('cr.child', 'child')
      .leftJoinAndMapOne(
        'cr.voucherLinkage',
        VoucherLinkageEntity,
        'vl',
        'vl.counselRequestId = cr.id',
      )
      // 기관 테이블 JOIN (district 조회용)
      .leftJoinAndMapOne(
        'child.careFacility',
        CareFacilityEntity,
        'cf',
        'cf.id = child.careFacilityId',
      )
      .leftJoinAndMapOne(
        'child.communityChildCenter',
        CommunityChildCenterEntity,
        'ccc',
        'ccc.id = child.communityChildCenterId',
      )
      .leftJoinAndMapOne(
        'child.educationWelfareSchool',
        EducationWelfareSchoolEntity,
        'ews',
        'ews.id = child.educationWelfareSchoolId',
      );

    // 상태 필터
    if (status) {
      queryBuilder.andWhere('cr.status = :status', { status });
    }

    // 돌봄 유형 필터
    if (careType) {
      queryBuilder.andWhere('cr.careType = :careType', { careType });
    }

    // 시설 구분 필터 (아동 유형 기반)
    if (childType) {
      queryBuilder.andWhere('child.childType = :childType', { childType });
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

    // 구/군 필터 (3개 기관 테이블 중 하나라도 매칭되면 됨)
    if (district) {
      queryBuilder.andWhere(
        '(cf.district = :district OR ccc.district = :district OR ews.district = :district)',
        { district },
      );
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
    cr: CounselRequestEntity & {
      voucherLinkage?: VoucherLinkageEntity;
      child?: {
        name?: string;
        childType?: ChildType;
        careFacility?: { district?: string } | null;
        communityChildCenter?: { district?: string } | null;
        educationWelfareSchool?: { district?: string } | null;
      };
    },
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

    // 구/군 정보 추출 (3개 기관 중 연결된 기관에서)
    const district =
      cr.child?.careFacility?.district ||
      cr.child?.communityChildCenter?.district ||
      cr.child?.educationWelfareSchool?.district;

    return {
      id: cr.id,
      childId: cr.childId,
      childName: cr.child?.name || '',
      childType: cr.child?.childType,
      status: cr.status,
      centerName: cr.centerName,
      district,
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
