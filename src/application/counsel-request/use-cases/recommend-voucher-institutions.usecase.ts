import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';
import { BImpactVoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/b-impact-voucher-institution.entity';
import { CommonVoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/common-voucher-institution.entity';
import { VoucherLinkageEntity } from '@infrastructure/persistence/typeorm/entity/voucher-linkage.entity';
import { OpenAIClient } from '@infrastructure/external/openai.client';
import { ChildType } from '@infrastructure/persistence/typeorm/entity/enums/child-type.enum';

export interface BImpactInstitutionRecommendationDto {
  id: string;
  name: string;
  district: string;
  address: string;
  services: string[];
  targetConditions: string[];
  counselorCertifications: string[];
  specialTherapy: string[];
  fullBatteryTestAvailable: boolean;
  guardianCounselingAvailable: boolean;
  pricingDescription: string | null;
  recommendationReason: string;
}

export interface CommonInstitutionRecommendationDto {
  id: string;
  name: string;
  district: string;
  address: string;
  phone: string | null;
  voucherTypes: string[];
  recommendationReason: string;
}

export interface VoucherInstitutionRecommendationResponseDto {
  bImpactInstitutions: BImpactInstitutionRecommendationDto[];
  commonInstitutions: CommonInstitutionRecommendationDto[];
}

@Injectable()
export class RecommendVoucherInstitutionsUseCase {
  private readonly logger = new Logger(RecommendVoucherInstitutionsUseCase.name);

  /** voucherType(짧은 형태) → investmentProjectCategories(정식 명칭) 매핑 */
  private static readonly VOUCHER_TYPE_TO_CATEGORY: Record<string, string> = {
    '심리치유': '아동청소년 심리치유서비스(우리아이가 달라졌어요!)',
    '정서발달': '아동정서발달 지원서비스',
  };

  constructor(
    @InjectRepository(CounselRequestEntity)
    private readonly counselRequestRepository: Repository<CounselRequestEntity>,
    @InjectRepository(ChildProfileEntity)
    private readonly childProfileRepository: Repository<ChildProfileEntity>,
    @InjectRepository(BImpactVoucherInstitutionEntity)
    private readonly bImpactRepository: Repository<BImpactVoucherInstitutionEntity>,
    @InjectRepository(CommonVoucherInstitutionEntity)
    private readonly commonRepository: Repository<CommonVoucherInstitutionEntity>,
    @InjectRepository(VoucherLinkageEntity)
    private readonly voucherLinkageRepository: Repository<VoucherLinkageEntity>,
    private readonly openAIClient: OpenAIClient,
  ) {}

  async execute(counselRequestId: string): Promise<VoucherInstitutionRecommendationResponseDto> {
    // 1. 상담의뢰 조회
    const counselRequest = await this.counselRequestRepository.findOne({
      where: { id: counselRequestId },
    });

    if (!counselRequest) {
      throw new NotFoundException(`상담의뢰를 찾을 수 없습니다: ${counselRequestId}`);
    }

    // 2. 아동 프로필 조회 (institution relations 포함)
    const childProfile = await this.childProfileRepository.findOne({
      where: { id: counselRequest.childId },
      relations: ['careFacility', 'communityChildCenter', 'educationWelfareSchool'],
    });

    if (!childProfile) {
      throw new NotFoundException(`아동 프로필을 찾을 수 없습니다: ${counselRequest.childId}`);
    }

    // 3. 바우처 연계 정보 조회 (voucherType 확인)
    const voucherLinkage = await this.voucherLinkageRepository.findOne({
      where: { counselRequestId },
    });

    const voucherType = voucherLinkage?.voucherType;
    const categoryName = voucherType
      ? RecommendVoucherInstitutionsUseCase.VOUCHER_TYPE_TO_CATEGORY[voucherType]
      : undefined;

    // 4. district 추출
    const district = this.extractDistrict(childProfile);

    if (!district) {
      this.logger.warn(`아동 ${childProfile.id}의 district를 추출할 수 없습니다`);
      return { bImpactInstitutions: [], commonInstitutions: [] };
    }

    // 5. 같은 district의 기관 조회
    const [allBImpact, allCommon] = await Promise.all([
      this.bImpactRepository.find({ where: { district, isActive: true } }),
      this.commonRepository.find({ where: { district } }),
    ]);

    // 6. voucherType 기반 필터링
    let filteredBImpact = allBImpact;
    let filteredCommon = allCommon;

    if (categoryName) {
      // B-IMPACT: investmentProjectCategories 배열에 해당 카테고리가 포함된 기관만
      filteredBImpact = allBImpact.filter(
        (inst) => inst.investmentProjectCategories?.includes(categoryName),
      );

      // 일반기관: voucherTypes 배열에 해당 바우처 타입이 포함된 기관만
      filteredCommon = allCommon.filter(
        (inst) => inst.voucherTypes?.includes(voucherType!),
      );
    }

    // 7. B-IMPACT 기관이 1개라도 있으면 B-IMPACT만, 없으면 일반기관만
    let bImpactInstitutions: BImpactVoucherInstitutionEntity[];
    let commonInstitutions: CommonVoucherInstitutionEntity[];

    if (filteredBImpact.length > 0) {
      // 적합한 B-IMPACT 기관 존재 → B-IMPACT만 추천
      bImpactInstitutions = filteredBImpact.length <= 2
        ? filteredBImpact
        : filteredBImpact.slice(0, 3);
      commonInstitutions = [];
    } else {
      // 적합한 B-IMPACT 기관 없음 → 일반기관만 추천
      bImpactInstitutions = [];
      commonInstitutions = filteredCommon.slice(0, 3);
    }

    // 8. OpenAI 추천 사유 생성
    const allInstitutions = [
      ...bImpactInstitutions.map((inst) => ({
        id: inst.id,
        name: inst.name,
        type: 'B_IMPACT' as const,
        services: inst.services,
        targetConditions: inst.targetConditions,
      })),
      ...commonInstitutions.map((inst) => ({
        id: inst.id,
        name: inst.name,
        type: 'COMMON' as const,
        voucherTypes: inst.voucherTypes,
      })),
    ];

    const childAge = this.calculateAge(childProfile.birthDate);
    const reasons = await this.openAIClient.generateRecommendationReasons(
      {
        name: childProfile.name,
        age: childAge,
        gender: childProfile.gender,
        specialNeeds: childProfile.specialNeeds,
        medicalInfo: childProfile.medicalInfo,
        counselRequestSummary: counselRequest.formData?.requestMotivation?.motivation,
      },
      allInstitutions,
    );

    // 9. 응답 조합
    return {
      bImpactInstitutions: bImpactInstitutions.map((inst) => ({
        id: inst.id,
        name: inst.name,
        district: inst.district,
        address: inst.address,
        services: inst.services,
        targetConditions: inst.targetConditions,
        counselorCertifications: inst.counselorCertifications,
        specialTherapy: inst.specialTherapy ?? [],
        fullBatteryTestAvailable: inst.fullBatteryTestAvailable ?? false,
        guardianCounselingAvailable: inst.guardianCounselingAvailable ?? false,
        pricingDescription: inst.pricingDescription,
        recommendationReason: reasons.get(inst.id) ?? `${inst.name}은(는) 같은 지역의 B-IMPACT 인증기관입니다.`,
      })),
      commonInstitutions: commonInstitutions.map((inst) => ({
        id: inst.id,
        name: inst.name,
        district: inst.district,
        address: inst.address,
        phone: inst.phone,
        voucherTypes: inst.voucherTypes,
        recommendationReason: reasons.get(inst.id) ?? `${inst.name}은(는) 같은 지역의 바우처 기관입니다.`,
      })),
    };
  }

  private extractDistrict(childProfile: ChildProfileEntity): string | null {
    switch (childProfile.childType) {
      case ChildType.CARE_FACILITY:
        return childProfile.careFacility?.district ?? null;
      case ChildType.COMMUNITY_CENTER:
        return childProfile.communityChildCenter?.district ?? null;
      case ChildType.EDUCATION_WELFARE_SCHOOL:
        return childProfile.educationWelfareSchool?.district ?? null;
      default:
        return null;
    }
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }
}
