import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AdminPaginatedResponseDto } from '@yeirin/admin-common';
import { VoucherLinkageEntity } from '@infrastructure/persistence/typeorm/entity/voucher-linkage.entity';
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
    @InjectRepository(ChildProfileEntity)
    private readonly childProfileRepository: Repository<ChildProfileEntity>,
    @InjectRepository(CareFacilityEntity)
    private readonly careFacilityRepository: Repository<CareFacilityEntity>,
    @InjectRepository(CommunityChildCenterEntity)
    private readonly communityChildCenterRepository: Repository<CommunityChildCenterEntity>,
    @InjectRepository(EducationWelfareSchoolEntity)
    private readonly educationWelfareSchoolRepository: Repository<EducationWelfareSchoolEntity>,
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
      sortOrder,
    } = query;

    // 1. VoucherLinkage 조회 (counselRequest 관계 포함, 기본 필터 적용)
    const qb = this.voucherLinkageRepository
      .createQueryBuilder('vl')
      .innerJoinAndSelect('vl.counselRequest', 'cr');

    // VoucherLinkage 필드 필터
    if (status) {
      qb.andWhere('vl.status = :status', { status });
    }
    if (linkageInfoSubmitted !== undefined) {
      qb.andWhere('vl.linkageInfoSubmitted = :linkageInfoSubmitted', { linkageInfoSubmitted });
    }
    if (wantsPlatformLinkage !== undefined) {
      qb.andWhere('vl.wantsPlatformLinkage = :wantsPlatformLinkage', { wantsPlatformLinkage });
    }
    if (startDate && endDate) {
      qb.andWhere('vl.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    // 정렬
    const orderDirection = sortOrder || 'DESC';
    qb.orderBy('vl.createdAt', orderDirection);

    // 먼저 전체 조회 (child/institution 필터는 TypeScript에서 적용)
    const allLinkages = await qb.getMany();

    if (allLinkages.length === 0) {
      return AdminPaginatedResponseDto.of([], 0, page, limit);
    }

    // 2. ChildProfile 배치 조회
    const childIds = [...new Set(allLinkages.map((vl) => vl.counselRequest.childId))];
    const children = await this.childProfileRepository.find({
      where: { id: In(childIds) },
    });
    const childMap = new Map(children.map((c) => [c.id, c]));

    // 3. 기관 정보 배치 조회
    const cfIds = [...new Set(children.filter((c) => c.careFacilityId).map((c) => c.careFacilityId as string))];
    const cccIds = [...new Set(children.filter((c) => c.communityChildCenterId).map((c) => c.communityChildCenterId as string))];
    const ewsIds = [...new Set(children.filter((c) => c.educationWelfareSchoolId).map((c) => c.educationWelfareSchoolId as string))];

    const [careFacilities, communityCenters, educationWelfareSchools] = await Promise.all([
      cfIds.length > 0
        ? this.careFacilityRepository.find({ where: { id: In(cfIds) } })
        : Promise.resolve([]),
      cccIds.length > 0
        ? this.communityChildCenterRepository.find({ where: { id: In(cccIds) } })
        : Promise.resolve([]),
      ewsIds.length > 0
        ? this.educationWelfareSchoolRepository.find({ where: { id: In(ewsIds) } })
        : Promise.resolve([]),
    ]);

    const cfMap = new Map(careFacilities.map((cf) => [cf.id, cf]));
    const cccMap = new Map(communityCenters.map((ccc) => [ccc.id, ccc]));
    const ewsMap = new Map(educationWelfareSchools.map((ews) => [ews.id, ews]));

    // 4. child/institution 기반 필터 적용
    let filteredLinkages = allLinkages.filter((vl) => {
      const child = childMap.get(vl.counselRequest.childId);
      if (!child) return false;

      // childType 필터
      if (childType && child.childType !== childType) return false;

      // district 필터
      if (district) {
        const cf = child.careFacilityId ? cfMap.get(child.careFacilityId) : null;
        const ccc = child.communityChildCenterId ? cccMap.get(child.communityChildCenterId) : null;
        const ews = child.educationWelfareSchoolId ? ewsMap.get(child.educationWelfareSchoolId) : null;
        const childDistrict = cf?.district || ccc?.district || ews?.district;
        if (childDistrict !== district) return false;
      }

      // search 필터
      if (search) {
        const searchLower = search.toLowerCase();
        const cf = child.careFacilityId ? cfMap.get(child.careFacilityId) : null;
        const ccc = child.communityChildCenterId ? cccMap.get(child.communityChildCenterId) : null;
        const ews = child.educationWelfareSchoolId ? ewsMap.get(child.educationWelfareSchoolId) : null;
        const instName = cf?.name || ccc?.name || ews?.name || '';
        const matched =
          child.name.toLowerCase().includes(searchLower) ||
          instName.toLowerCase().includes(searchLower);
        if (!matched) return false;
      }

      return true;
    });

    const total = filteredLinkages.length;

    // 5. 페이지네이션
    const offset = (page - 1) * limit;
    const paginatedLinkages = filteredLinkages.slice(offset, offset + limit);

    // 6. B-IMPACT / COMMON 기관명 배치 조회
    const bImpactIds: string[] = [];
    const commonIds: string[] = [];
    for (const vl of paginatedLinkages) {
      if (vl.linkedVoucherInstitutionId && vl.linkedVoucherInstitutionType) {
        if (vl.linkedVoucherInstitutionType === 'B_IMPACT') {
          bImpactIds.push(vl.linkedVoucherInstitutionId);
        } else if (vl.linkedVoucherInstitutionType === 'COMMON') {
          commonIds.push(vl.linkedVoucherInstitutionId);
        }
      }
    }

    const [bImpactInstitutions, commonInstitutions] = await Promise.all([
      bImpactIds.length > 0
        ? this.bImpactRepository.find({ where: { id: In(bImpactIds) }, select: ['id', 'name'] })
        : Promise.resolve([]),
      commonIds.length > 0
        ? this.commonRepository.find({ where: { id: In(commonIds) }, select: ['id', 'name'] })
        : Promise.resolve([]),
    ]);

    const bImpactMap = new Map(bImpactInstitutions.map((i) => [i.id, i.name]));
    const commonMap = new Map(commonInstitutions.map((i) => [i.id, i.name]));

    // 7. 응답 매핑
    const data: VoucherLinkageStatusResponseDto[] = paginatedLinkages.map((vl) => {
      const child = childMap.get(vl.counselRequest.childId);
      const cf = child?.careFacilityId ? cfMap.get(child.careFacilityId) : null;
      const ccc = child?.communityChildCenterId ? cccMap.get(child.communityChildCenterId) : null;
      const ews = child?.educationWelfareSchoolId ? ewsMap.get(child.educationWelfareSchoolId) : null;

      const institutionName = cf?.name || ccc?.name || ews?.name || '';
      const institutionDistrict = cf?.district || ccc?.district || ews?.district || '';

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
        childName: child?.name || '',
        childType: child?.childType || '',
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
