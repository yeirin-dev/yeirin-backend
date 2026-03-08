import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';
import { BImpactVoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/b-impact-voucher-institution.entity';
import { CommonVoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/common-voucher-institution.entity';
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

  constructor(
    @InjectRepository(CounselRequestEntity)
    private readonly counselRequestRepository: Repository<CounselRequestEntity>,
    @InjectRepository(ChildProfileEntity)
    private readonly childProfileRepository: Repository<ChildProfileEntity>,
    @InjectRepository(BImpactVoucherInstitutionEntity)
    private readonly bImpactRepository: Repository<BImpactVoucherInstitutionEntity>,
    @InjectRepository(CommonVoucherInstitutionEntity)
    private readonly commonRepository: Repository<CommonVoucherInstitutionEntity>,
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

    // 3. district 추출
    const district = this.extractDistrict(childProfile);

    if (!district) {
      this.logger.warn(`아동 ${childProfile.id}의 district를 추출할 수 없습니다`);
      return { bImpactInstitutions: [], commonInstitutions: [] };
    }

    // 4. 같은 district의 기관 조회
    const [bImpactInstitutions, commonInstitutions] = await Promise.all([
      this.bImpactRepository.find({ where: { district } }),
      this.commonRepository.find({ where: { district } }),
    ]);

    // 5. OpenAI 추천 사유 생성
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

    // 6. 응답 조합
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
