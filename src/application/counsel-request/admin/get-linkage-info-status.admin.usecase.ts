import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminPaginatedResponseDto } from '@yeirin/admin-common';
import { VoucherLinkageEntity } from '@infrastructure/persistence/typeorm/entity/voucher-linkage.entity';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';
import { CareFacilityEntity } from '@infrastructure/persistence/typeorm/entity/care-facility.entity';
import { CommunityChildCenterEntity } from '@infrastructure/persistence/typeorm/entity/community-child-center.entity';
import { EducationWelfareSchoolEntity } from '@infrastructure/persistence/typeorm/entity/education-welfare-school.entity';
import { LinkageInfoStatusQueryDto } from './dto/linkage-info-status-query.dto';

interface LinkageInfoStatusResponseDto {
  institutionId: string;
  institutionName: string;
  institutionType: 'CARE_FACILITY' | 'COMMUNITY_CENTER' | 'EDUCATION_WELFARE_SCHOOL';
  district: string;
  totalChildren: number;
  submittedCount: number;
  notSubmittedCount: number;
  submissionRate: number;
  contactPersonName: string;
  contactPhone: string;
}

interface RawAggregation {
  institutionId: string;
  institutionType: string;
  totalChildren: string;
  submittedCount: string;
}

/**
 * 연계정보입력 현황 UseCase
 * 기관별 바우처 대상 아동 제출률 집계
 */
@Injectable()
export class GetLinkageInfoStatusAdminUseCase {
  constructor(
    @InjectRepository(VoucherLinkageEntity)
    private readonly voucherLinkageRepository: Repository<VoucherLinkageEntity>,
    @InjectRepository(CareFacilityEntity)
    private readonly careFacilityRepository: Repository<CareFacilityEntity>,
    @InjectRepository(CommunityChildCenterEntity)
    private readonly communityChildCenterRepository: Repository<CommunityChildCenterEntity>,
    @InjectRepository(EducationWelfareSchoolEntity)
    private readonly educationWelfareSchoolRepository: Repository<EducationWelfareSchoolEntity>,
  ) {}

  async execute(
    query: LinkageInfoStatusQueryDto,
  ): Promise<AdminPaginatedResponseDto<LinkageInfoStatusResponseDto>> {
    const { page = 1, limit = 20, childType, district } = query;

    // 기관별 집계 쿼리 작성
    // VoucherLinkage → CounselRequest → ChildProfile 조인 후
    // 소속 기관 ID 기준으로 GROUP BY
    const qb = this.voucherLinkageRepository
      .createQueryBuilder('vl')
      .innerJoin(CounselRequestEntity, 'cr', 'cr.id = vl.counselRequestId')
      .innerJoin(ChildProfileEntity, 'child', 'child.id = cr.childId')
      .select(
        `CASE
          WHEN child.careFacilityId IS NOT NULL THEN child.careFacilityId
          WHEN child.communityChildCenterId IS NOT NULL THEN child.communityChildCenterId
          WHEN child.educationWelfareSchoolId IS NOT NULL THEN child.educationWelfareSchoolId
        END`,
        'institutionId',
      )
      .addSelect(
        `CASE
          WHEN child.careFacilityId IS NOT NULL THEN 'CARE_FACILITY'
          WHEN child.communityChildCenterId IS NOT NULL THEN 'COMMUNITY_CENTER'
          WHEN child.educationWelfareSchoolId IS NOT NULL THEN 'EDUCATION_WELFARE_SCHOOL'
        END`,
        'institutionType',
      )
      .addSelect('COUNT(*)', 'totalChildren')
      .addSelect('SUM(CASE WHEN vl.linkage_info_submitted = true THEN 1 ELSE 0 END)', 'submittedCount')
      .groupBy(
        `CASE
          WHEN child.careFacilityId IS NOT NULL THEN child.careFacilityId
          WHEN child.communityChildCenterId IS NOT NULL THEN child.communityChildCenterId
          WHEN child.educationWelfareSchoolId IS NOT NULL THEN child.educationWelfareSchoolId
        END`,
      )
      .addGroupBy(
        `CASE
          WHEN child.careFacilityId IS NOT NULL THEN 'CARE_FACILITY'
          WHEN child.communityChildCenterId IS NOT NULL THEN 'COMMUNITY_CENTER'
          WHEN child.educationWelfareSchoolId IS NOT NULL THEN 'EDUCATION_WELFARE_SCHOOL'
        END`,
      );

    // 기관 소속이 없는 아동(REGULAR) 제외
    qb.andWhere(
      `(child.careFacilityId IS NOT NULL OR child.communityChildCenterId IS NOT NULL OR child.educationWelfareSchoolId IS NOT NULL)`,
    );

    // childType 필터
    if (childType) {
      qb.andWhere('child.childType = :childType', { childType });
    }

    // district 필터 — 기관 테이블 LEFT JOIN 필요
    if (district) {
      qb.leftJoin(CareFacilityEntity, 'cf', 'cf.id = child.careFacilityId')
        .leftJoin(CommunityChildCenterEntity, 'ccc', 'ccc.id = child.communityChildCenterId')
        .leftJoin(EducationWelfareSchoolEntity, 'ews', 'ews.id = child.educationWelfareSchoolId')
        .andWhere(
          '(cf.district = :district OR ccc.district = :district OR ews.district = :district)',
          { district },
        );
    }

    // 기관 ID가 null인 행 제외
    qb.having(
      `CASE
        WHEN child.careFacilityId IS NOT NULL THEN child.careFacilityId
        WHEN child.communityChildCenterId IS NOT NULL THEN child.communityChildCenterId
        WHEN child.educationWelfareSchoolId IS NOT NULL THEN child.educationWelfareSchoolId
      END IS NOT NULL`,
    );

    // 전체 개수 조회 (페이지네이션용)
    const allAggregations = await qb.getRawMany<RawAggregation>();
    const total = allAggregations.length;

    // 페이지네이션 적용
    const offset = (page - 1) * limit;
    const paginatedAggregations = allAggregations.slice(offset, offset + limit);

    // 기관 ID들 추출 → 배치 조회
    const careFacilityIds: string[] = [];
    const communityCenterIds: string[] = [];
    const educationWelfareSchoolIds: string[] = [];

    for (const row of paginatedAggregations) {
      switch (row.institutionType) {
        case 'CARE_FACILITY':
          careFacilityIds.push(row.institutionId);
          break;
        case 'COMMUNITY_CENTER':
          communityCenterIds.push(row.institutionId);
          break;
        case 'EDUCATION_WELFARE_SCHOOL':
          educationWelfareSchoolIds.push(row.institutionId);
          break;
      }
    }

    // 기관 정보 배치 조회
    const [careFacilities, communityCenters, educationWelfareSchools] = await Promise.all([
      careFacilityIds.length > 0
        ? this.careFacilityRepository
            .createQueryBuilder('cf')
            .where('cf.id IN (:...ids)', { ids: careFacilityIds })
            .getMany()
        : Promise.resolve([]),
      communityCenterIds.length > 0
        ? this.communityChildCenterRepository
            .createQueryBuilder('ccc')
            .where('ccc.id IN (:...ids)', { ids: communityCenterIds })
            .getMany()
        : Promise.resolve([]),
      educationWelfareSchoolIds.length > 0
        ? this.educationWelfareSchoolRepository
            .createQueryBuilder('ews')
            .where('ews.id IN (:...ids)', { ids: educationWelfareSchoolIds })
            .getMany()
        : Promise.resolve([]),
    ]);

    // Map으로 변환
    const cfMap = new Map(careFacilities.map((cf) => [cf.id, cf]));
    const cccMap = new Map(communityCenters.map((ccc) => [ccc.id, ccc]));
    const ewsMap = new Map(educationWelfareSchools.map((ews) => [ews.id, ews]));

    // 응답 DTO 매핑
    const data: LinkageInfoStatusResponseDto[] = paginatedAggregations.map((row) => {
      const totalChildren = parseInt(row.totalChildren, 10);
      const submittedCount = parseInt(row.submittedCount, 10);
      const notSubmittedCount = totalChildren - submittedCount;
      const submissionRate = totalChildren > 0 ? (submittedCount / totalChildren) * 100 : 0;

      let institutionName = '';
      let institutionDistrict = '';
      let contactPersonName = '';
      let contactPhone = '';

      switch (row.institutionType) {
        case 'CARE_FACILITY': {
          const cf = cfMap.get(row.institutionId);
          institutionName = cf?.name || '';
          institutionDistrict = cf?.district || '';
          contactPersonName = cf?.representativeName || '';
          contactPhone = cf?.phoneNumber || '';
          break;
        }
        case 'COMMUNITY_CENTER': {
          const ccc = cccMap.get(row.institutionId);
          institutionName = ccc?.name || '';
          institutionDistrict = ccc?.district || '';
          contactPersonName = ccc?.managerName || ccc?.directorName || '';
          contactPhone = ccc?.managerPhone || ccc?.phoneNumber || '';
          break;
        }
        case 'EDUCATION_WELFARE_SCHOOL': {
          const ews = ewsMap.get(row.institutionId);
          institutionName = ews?.name || '';
          institutionDistrict = ews?.district || '';
          contactPersonName = ews?.welfareWorkerName || '';
          contactPhone = ews?.welfareWorkerPhone || '';
          break;
        }
      }

      return {
        institutionId: row.institutionId,
        institutionName,
        institutionType: row.institutionType as LinkageInfoStatusResponseDto['institutionType'],
        district: institutionDistrict,
        totalChildren,
        submittedCount,
        notSubmittedCount,
        submissionRate: Math.round(submissionRate * 10) / 10,
        contactPersonName,
        contactPhone,
      };
    });

    return AdminPaginatedResponseDto.of(data, total, page, limit);
  }
}
