import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AdminPaginatedResponseDto } from '@yeirin/admin-common';
import { VoucherLinkageEntity } from '@infrastructure/persistence/typeorm/entity/voucher-linkage.entity';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';
import { CareFacilityEntity } from '@infrastructure/persistence/typeorm/entity/care-facility.entity';
import { CommunityChildCenterEntity } from '@infrastructure/persistence/typeorm/entity/community-child-center.entity';
import { EducationWelfareSchoolEntity } from '@infrastructure/persistence/typeorm/entity/education-welfare-school.entity';
import { BImpactVoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/b-impact-voucher-institution.entity';
import { CommonVoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/common-voucher-institution.entity';
import { VoucherLinkageStatusQueryDto } from './dto/voucher-linkage-status-query.dto';

interface VoucherLinkageStatusResponseDto {
  linkageId: string;
  counselRequestId: string;
  status: string;
  childName: string;
  childType: string;
  institutionName: string;
  district: string;
  linkageInfoSubmitted: boolean;
  isVoucherConfirmed: boolean | null;
  voucherType: string | null;
  wantsPlatformLinkage: boolean | null;
  linkageDeclineReason: string | null;
  linkedVoucherInstitutionId: string | null;
  linkedVoucherInstitutionType: string | null;
  linkedVoucherInstitutionName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 연계현황 UseCase
 * 보호자 제출 정보 + 선택 기관 추적
 */
@Injectable()
export class GetVoucherLinkageStatusAdminUseCase {
  constructor(
    @InjectRepository(VoucherLinkageEntity)
    private readonly voucherLinkageRepository: Repository<VoucherLinkageEntity>,
    @InjectRepository(BImpactVoucherInstitutionEntity)
    private readonly bImpactRepository: Repository<BImpactVoucherInstitutionEntity>,
    @InjectRepository(CommonVoucherInstitutionEntity)
    private readonly commonRepository: Repository<CommonVoucherInstitutionEntity>,
  ) {}

  async execute(
    query: VoucherLinkageStatusQueryDto,
  ): Promise<AdminPaginatedResponseDto<VoucherLinkageStatusResponseDto>> {
    const {
      page = 1,
      limit = 20,
      search,
      district,
      childType,
      status,
      linkageInfoSubmitted,
      wantsPlatformLinkage,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = query;

    const qb = this.voucherLinkageRepository
      .createQueryBuilder('vl')
      .innerJoinAndSelect('vl.counselRequest', 'cr')
      .innerJoin(ChildProfileEntity, 'child', 'child.id = cr.childId')
      .addSelect(['child.id', 'child.name', 'child.childType', 'child.careFacilityId', 'child.communityChildCenterId', 'child.educationWelfareSchoolId'])
      .leftJoin(CareFacilityEntity, 'cf', 'cf.id = child.careFacilityId')
      .addSelect(['cf.id', 'cf.name', 'cf.district'])
      .leftJoin(CommunityChildCenterEntity, 'ccc', 'ccc.id = child.communityChildCenterId')
      .addSelect(['ccc.id', 'ccc.name', 'ccc.district'])
      .leftJoin(EducationWelfareSchoolEntity, 'ews', 'ews.id = child.educationWelfareSchoolId')
      .addSelect(['ews.id', 'ews.name', 'ews.district']);

    // 필터: 연계 상태
    if (status) {
      qb.andWhere('vl.status = :status', { status });
    }

    // 필터: 연계정보 제출 여부
    if (linkageInfoSubmitted !== undefined) {
      qb.andWhere('vl.linkageInfoSubmitted = :linkageInfoSubmitted', { linkageInfoSubmitted });
    }

    // 필터: 플랫폼 연계 희망 여부
    if (wantsPlatformLinkage !== undefined) {
      qb.andWhere('vl.wantsPlatformLinkage = :wantsPlatformLinkage', { wantsPlatformLinkage });
    }

    // 필터: 시설 구분
    if (childType) {
      qb.andWhere('child.childType = :childType', { childType });
    }

    // 필터: 구/군
    if (district) {
      qb.andWhere(
        '(cf.district = :district OR ccc.district = :district OR ews.district = :district)',
        { district },
      );
    }

    // 필터: 검색어
    if (search) {
      qb.andWhere(
        '(child.name ILIKE :search OR cf.name ILIKE :search OR ccc.name ILIKE :search OR ews.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 필터: 날짜 범위
    if (startDate && endDate) {
      qb.andWhere('vl.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    // 정렬
    const orderField = sortBy || 'createdAt';
    const orderDirection = sortOrder || 'DESC';
    qb.orderBy(`vl.${orderField}`, orderDirection);

    // 페이지네이션
    qb.skip((page - 1) * limit).take(limit);

    // 쿼리 실행 — raw + entity 방식으로 조회
    const [rawResults, total] = await qb.getManyAndCount();

    // linkedVoucherInstitutionId가 있는 레코드에서 기관명 배치 조회
    const bImpactIds: string[] = [];
    const commonIds: string[] = [];

    // rawResults에서는 voucherLinkage와 counselRequest는 entity로 가져와지지만
    // child, cf, ccc, ews는 addSelect로 가져왔으므로 raw 쿼리가 필요합니다.
    // 대신 별도 쿼리로 처리합니다.

    // VoucherLinkage ID 목록으로 필요한 데이터를 raw로 다시 가져옵니다.
    const vlIds = rawResults.map((vl) => vl.id);
    let detailRows: Array<{
      vl_id: string;
      child_name: string;
      child_childType: string;
      cf_name: string | null;
      cf_district: string | null;
      ccc_name: string | null;
      ccc_district: string | null;
      ews_name: string | null;
      ews_district: string | null;
    }> = [];

    if (vlIds.length > 0) {
      detailRows = await this.voucherLinkageRepository
        .createQueryBuilder('vl')
        .innerJoin(CounselRequestEntity, 'cr', 'cr.id = vl.counselRequestId')
        .innerJoin(ChildProfileEntity, 'child', 'child.id = cr.childId')
        .leftJoin(CareFacilityEntity, 'cf', 'cf.id = child.careFacilityId')
        .leftJoin(CommunityChildCenterEntity, 'ccc', 'ccc.id = child.communityChildCenterId')
        .leftJoin(EducationWelfareSchoolEntity, 'ews', 'ews.id = child.educationWelfareSchoolId')
        .select('vl.id', 'vl_id')
        .addSelect('child.name', 'child_name')
        .addSelect('child.childType', 'child_childType')
        .addSelect('cf.name', 'cf_name')
        .addSelect('cf.district', 'cf_district')
        .addSelect('ccc.name', 'ccc_name')
        .addSelect('ccc.district', 'ccc_district')
        .addSelect('ews.name', 'ews_name')
        .addSelect('ews.district', 'ews_district')
        .where('vl.id IN (:...vlIds)', { vlIds })
        .getRawMany();
    }

    const detailMap = new Map(detailRows.map((row) => [row.vl_id, row]));

    // B-IMPACT / COMMON 기관 ID 수집
    for (const vl of rawResults) {
      if (vl.linkedVoucherInstitutionId && vl.linkedVoucherInstitutionType) {
        if (vl.linkedVoucherInstitutionType === 'B_IMPACT') {
          bImpactIds.push(vl.linkedVoucherInstitutionId);
        } else if (vl.linkedVoucherInstitutionType === 'COMMON') {
          commonIds.push(vl.linkedVoucherInstitutionId);
        }
      }
    }

    // 바우처 기관명 배치 조회
    const [bImpactInstitutions, commonInstitutions] = await Promise.all([
      bImpactIds.length > 0
        ? this.bImpactRepository.find({
            where: { id: In(bImpactIds) },
            select: ['id', 'name'],
          })
        : Promise.resolve([]),
      commonIds.length > 0
        ? this.commonRepository.find({
            where: { id: In(commonIds) },
            select: ['id', 'name'],
          })
        : Promise.resolve([]),
    ]);

    const bImpactMap = new Map(bImpactInstitutions.map((i) => [i.id, i.name]));
    const commonMap = new Map(commonInstitutions.map((i) => [i.id, i.name]));

    // 응답 매핑
    const data: VoucherLinkageStatusResponseDto[] = rawResults.map((vl) => {
      const detail = detailMap.get(vl.id);
      const institutionName = detail?.cf_name || detail?.ccc_name || detail?.ews_name || '';
      const institutionDistrict = detail?.cf_district || detail?.ccc_district || detail?.ews_district || '';

      let linkedVoucherInstitutionName: string | null = null;
      if (vl.linkedVoucherInstitutionId && vl.linkedVoucherInstitutionType) {
        if (vl.linkedVoucherInstitutionType === 'B_IMPACT') {
          linkedVoucherInstitutionName = bImpactMap.get(vl.linkedVoucherInstitutionId) || null;
        } else if (vl.linkedVoucherInstitutionType === 'COMMON') {
          linkedVoucherInstitutionName = commonMap.get(vl.linkedVoucherInstitutionId) || null;
        }
      }

      return {
        linkageId: vl.id,
        counselRequestId: vl.counselRequestId,
        status: vl.status,
        childName: detail?.child_name || '',
        childType: detail?.child_childType || '',
        institutionName,
        district: institutionDistrict,
        linkageInfoSubmitted: vl.linkageInfoSubmitted,
        isVoucherConfirmed: vl.isVoucherConfirmed ?? null,
        voucherType: vl.voucherType ?? null,
        wantsPlatformLinkage: vl.wantsPlatformLinkage ?? null,
        linkageDeclineReason: vl.linkageDeclineReason ?? null,
        linkedVoucherInstitutionId: vl.linkedVoucherInstitutionId ?? null,
        linkedVoucherInstitutionType: vl.linkedVoucherInstitutionType ?? null,
        linkedVoucherInstitutionName,
        createdAt: vl.createdAt,
        updatedAt: vl.updatedAt,
      };
    });

    return AdminPaginatedResponseDto.of(data, total, page, limit);
  }
}
