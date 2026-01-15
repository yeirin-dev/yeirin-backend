import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CareFacilityEntity } from '@infrastructure/persistence/typeorm/entity/care-facility.entity';
import { CommunityChildCenterEntity } from '@infrastructure/persistence/typeorm/entity/community-child-center.entity';
import { EducationWelfareSchoolEntity } from '@infrastructure/persistence/typeorm/entity/education-welfare-school.entity';
import {
  CategoryCountDto,
  FacilityType,
  FacilityTypeDisplayName,
  PartnerDto,
  PartnerListResponseDto,
  PartnerQueryDto,
} from './dto/partner.dto';

/**
 * Landing 페이지 서비스
 * - 파트너 기관 목록 조회 (인증 불필요)
 */
@Injectable()
export class LandingService {
  constructor(
    @InjectRepository(CareFacilityEntity)
    private readonly careFacilityRepository: Repository<CareFacilityEntity>,
    @InjectRepository(CommunityChildCenterEntity)
    private readonly communityChildCenterRepository: Repository<CommunityChildCenterEntity>,
    @InjectRepository(EducationWelfareSchoolEntity)
    private readonly educationWelfareSchoolRepository: Repository<EducationWelfareSchoolEntity>,
  ) {}

  /**
   * 파트너 기관 목록 조회
   */
  async getPartners(query: PartnerQueryDto): Promise<PartnerListResponseDto> {
    const { page = 1, limit = 10, facilityType, district } = query;

    // 모든 활성 기관 조회 (카테고리 카운트 계산용)
    const allPartners = await this.fetchAllActivePartners();

    // 필터링
    let filteredPartners = allPartners;

    if (facilityType) {
      filteredPartners = filteredPartners.filter(
        (p) => p.facilityType === facilityType,
      );
    }

    if (district) {
      filteredPartners = filteredPartners.filter(
        (p) => p.district === district,
      );
    }

    // 정렬 (구/군 → 이름)
    filteredPartners.sort((a, b) => {
      const districtCompare = a.district.localeCompare(b.district, 'ko');
      return districtCompare !== 0
        ? districtCompare
        : a.name.localeCompare(b.name, 'ko');
    });

    // 페이지네이션
    const total = filteredPartners.length;
    const totalPages = Math.ceil(total / limit);
    const startIdx = (page - 1) * limit;
    const paginatedPartners = filteredPartners.slice(startIdx, startIdx + limit);

    // 카테고리별 카운트 (전체 데이터 기준)
    const categoryCounts = this.calculateCategoryCounts(allPartners);

    // 사용 가능한 구/군 목록 (전체 데이터 기준)
    const availableDistricts = [
      ...new Set(allPartners.map((p) => p.district)),
    ].sort((a, b) => a.localeCompare(b, 'ko'));

    return {
      partners: paginatedPartners,
      total,
      page,
      limit,
      totalPages,
      categoryCounts,
      availableDistricts,
    };
  }

  /**
   * 구/군 목록 조회
   */
  async getDistricts(): Promise<string[]> {
    const [careFacilityDistricts, communityChildCenterDistricts, educationWelfareSchoolDistricts] =
      await Promise.all([
        this.careFacilityRepository
          .createQueryBuilder('facility')
          .select('DISTINCT facility.district', 'district')
          .where('facility.isActive = :isActive', { isActive: true })
          .getRawMany<{ district: string }>(),
        this.communityChildCenterRepository
          .createQueryBuilder('center')
          .select('DISTINCT center.district', 'district')
          .where('center.isActive = :isActive', { isActive: true })
          .getRawMany<{ district: string }>(),
        this.educationWelfareSchoolRepository
          .createQueryBuilder('school')
          .select('DISTINCT school.district', 'district')
          .where('school.isActive = :isActive', { isActive: true })
          .getRawMany<{ district: string }>(),
      ]);

    const allDistricts = new Set<string>();
    careFacilityDistricts.forEach((r) => allDistricts.add(r.district));
    communityChildCenterDistricts.forEach((r) => allDistricts.add(r.district));
    educationWelfareSchoolDistricts.forEach((r) => allDistricts.add(r.district));

    return Array.from(allDistricts).sort((a, b) => a.localeCompare(b, 'ko'));
  }

  /**
   * 모든 활성 기관 조회 (통합)
   */
  private async fetchAllActivePartners(): Promise<PartnerDto[]> {
    const [careFacilities, communityChildCenters, educationWelfareSchools] =
      await Promise.all([
        this.careFacilityRepository.find({
          where: { isActive: true },
          order: { name: 'ASC' },
        }),
        this.communityChildCenterRepository.find({
          where: { isActive: true },
          order: { name: 'ASC' },
        }),
        this.educationWelfareSchoolRepository.find({
          where: { isActive: true },
          order: { name: 'ASC' },
        }),
      ]);

    const partners: PartnerDto[] = [];

    // 양육시설
    partners.push(
      ...careFacilities.map((f) => ({
        id: f.id,
        name: f.name,
        facilityType: FacilityType.CARE_FACILITY,
        facilityTypeDisplayName: FacilityTypeDisplayName[FacilityType.CARE_FACILITY],
        district: f.district,
        phoneNumber: f.phoneNumber || null,
      })),
    );

    // 지역아동센터
    partners.push(
      ...communityChildCenters.map((c) => ({
        id: c.id,
        name: c.name,
        facilityType: FacilityType.COMMUNITY_CENTER,
        facilityTypeDisplayName: FacilityTypeDisplayName[FacilityType.COMMUNITY_CENTER],
        district: c.district,
        phoneNumber: c.phoneNumber || null,
      })),
    );

    // 교육복지사협회 학교
    partners.push(
      ...educationWelfareSchools.map((s) => ({
        id: s.id,
        name: s.name,
        facilityType: FacilityType.EDUCATION_WELFARE_SCHOOL,
        facilityTypeDisplayName: FacilityTypeDisplayName[FacilityType.EDUCATION_WELFARE_SCHOOL],
        district: s.district,
        phoneNumber: s.phoneNumber || null,
      })),
    );

    return partners;
  }

  /**
   * 카테고리별 기관 수 계산
   */
  private calculateCategoryCounts(partners: PartnerDto[]): CategoryCountDto[] {
    const counts: Record<FacilityType, number> = {
      [FacilityType.CARE_FACILITY]: 0,
      [FacilityType.COMMUNITY_CENTER]: 0,
      [FacilityType.EDUCATION_WELFARE_SCHOOL]: 0,
    };

    partners.forEach((p) => {
      counts[p.facilityType]++;
    });

    return Object.entries(counts).map(([type, count]) => ({
      facilityType: type as FacilityType,
      label: FacilityTypeDisplayName[type as FacilityType],
      count,
    }));
  }
}
