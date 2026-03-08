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

interface InstitutionAggregation {
  institutionId: string;
  institutionType: 'CARE_FACILITY' | 'COMMUNITY_CENTER' | 'EDUCATION_WELFARE_SCHOOL';
  totalChildren: number;
  submittedCount: number;
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
    @InjectRepository(ChildProfileEntity)
    private readonly childProfileRepository: Repository<ChildProfileEntity>,
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

    // 1. VoucherLinkage 전체 조회 (counselRequest 관계 포함)
    const linkages = await this.voucherLinkageRepository.find({
      relations: ['counselRequest'],
    });

    if (linkages.length === 0) {
      return AdminPaginatedResponseDto.of([], 0, page, limit);
    }

    // 2. ChildProfile 배치 조회 (기관 ID 포함)
    const childIds = linkages.map((vl) => vl.counselRequest.childId);
    const children = await this.childProfileRepository.find({
      where: { id: In(childIds) },
    });
    const childMap = new Map(children.map((c) => [c.id, c]));

    // 3. childType 필터 적용
    const filteredLinkages = linkages.filter((vl) => {
      const child = childMap.get(vl.counselRequest.childId);
      if (!child) return false;
      if (childType && child.childType !== childType) return false;
      // 기관 소속이 없는 아동(REGULAR) 제외
      if (!child.careFacilityId && !child.communityChildCenterId && !child.educationWelfareSchoolId) {
        return false;
      }
      return true;
    });

    // 4. 기관별 집계 (TypeScript에서 GROUP BY)
    const aggregationMap = new Map<string, InstitutionAggregation>();

    for (const vl of filteredLinkages) {
      const child = childMap.get(vl.counselRequest.childId);
      if (!child) continue;

      let institutionId: string;
      let institutionType: InstitutionAggregation['institutionType'];

      if (child.careFacilityId) {
        institutionId = child.careFacilityId;
        institutionType = 'CARE_FACILITY';
      } else if (child.communityChildCenterId) {
        institutionId = child.communityChildCenterId;
        institutionType = 'COMMUNITY_CENTER';
      } else if (child.educationWelfareSchoolId) {
        institutionId = child.educationWelfareSchoolId;
        institutionType = 'EDUCATION_WELFARE_SCHOOL';
      } else {
        continue;
      }

      const existing = aggregationMap.get(institutionId);
      if (existing) {
        existing.totalChildren += 1;
        if (vl.linkageInfoSubmitted) existing.submittedCount += 1;
      } else {
        aggregationMap.set(institutionId, {
          institutionId,
          institutionType,
          totalChildren: 1,
          submittedCount: vl.linkageInfoSubmitted ? 1 : 0,
        });
      }
    }

    // 5. 기관 정보 배치 조회
    const careFacilityIds: string[] = [];
    const communityCenterIds: string[] = [];
    const educationWelfareSchoolIds: string[] = [];

    for (const agg of aggregationMap.values()) {
      switch (agg.institutionType) {
        case 'CARE_FACILITY':
          careFacilityIds.push(agg.institutionId);
          break;
        case 'COMMUNITY_CENTER':
          communityCenterIds.push(agg.institutionId);
          break;
        case 'EDUCATION_WELFARE_SCHOOL':
          educationWelfareSchoolIds.push(agg.institutionId);
          break;
      }
    }

    const [careFacilities, communityCenters, educationWelfareSchools] = await Promise.all([
      careFacilityIds.length > 0
        ? this.careFacilityRepository.find({ where: { id: In(careFacilityIds) } })
        : Promise.resolve([]),
      communityCenterIds.length > 0
        ? this.communityChildCenterRepository.find({ where: { id: In(communityCenterIds) } })
        : Promise.resolve([]),
      educationWelfareSchoolIds.length > 0
        ? this.educationWelfareSchoolRepository.find({ where: { id: In(educationWelfareSchoolIds) } })
        : Promise.resolve([]),
    ]);

    const cfMap = new Map(careFacilities.map((cf) => [cf.id, cf]));
    const cccMap = new Map(communityCenters.map((ccc) => [ccc.id, ccc]));
    const ewsMap = new Map(educationWelfareSchools.map((ews) => [ews.id, ews]));

    // 6. 응답 DTO 매핑 + district 필터 적용
    let results: LinkageInfoStatusResponseDto[] = [];

    for (const agg of aggregationMap.values()) {
      const notSubmittedCount = agg.totalChildren - agg.submittedCount;
      const submissionRate = agg.totalChildren > 0
        ? Math.round((agg.submittedCount / agg.totalChildren) * 1000) / 10
        : 0;

      let institutionName = '';
      let institutionDistrict = '';
      let contactPersonName = '';
      let contactPhone = '';

      switch (agg.institutionType) {
        case 'CARE_FACILITY': {
          const cf = cfMap.get(agg.institutionId);
          institutionName = cf?.name || '';
          institutionDistrict = cf?.district || '';
          contactPersonName = cf?.representativeName || '';
          contactPhone = cf?.phoneNumber || '';
          break;
        }
        case 'COMMUNITY_CENTER': {
          const ccc = cccMap.get(agg.institutionId);
          institutionName = ccc?.name || '';
          institutionDistrict = ccc?.district || '';
          contactPersonName = ccc?.managerName || ccc?.directorName || '';
          contactPhone = ccc?.managerPhone || ccc?.phoneNumber || '';
          break;
        }
        case 'EDUCATION_WELFARE_SCHOOL': {
          const ews = ewsMap.get(agg.institutionId);
          institutionName = ews?.name || '';
          institutionDistrict = ews?.district || '';
          contactPersonName = ews?.welfareWorkerName || '';
          contactPhone = ews?.welfareWorkerPhone || '';
          break;
        }
      }

      // district 필터 적용
      if (district && institutionDistrict !== district) continue;

      results.push({
        institutionId: agg.institutionId,
        institutionName,
        institutionType: agg.institutionType,
        district: institutionDistrict,
        totalChildren: agg.totalChildren,
        submittedCount: agg.submittedCount,
        notSubmittedCount,
        submissionRate,
        contactPersonName,
        contactPhone,
      });
    }

    // 7. 정렬 (기관명 기준)
    results.sort((a, b) => a.institutionName.localeCompare(b.institutionName, 'ko'));

    // 8. 페이지네이션
    const total = results.length;
    const offset = (page - 1) * limit;
    const paginatedData = results.slice(offset, offset + limit);

    return AdminPaginatedResponseDto.of(paginatedData, total, page, limit);
  }
}
