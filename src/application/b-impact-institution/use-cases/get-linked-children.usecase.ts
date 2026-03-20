import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VoucherLinkageRepository, VOUCHER_LINKAGE_REPOSITORY } from '@domain/voucher-linkage/repository/voucher-linkage.repository';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { CounselRequestRecommendationEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request-recommendation.entity';
import { BImpactVoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/b-impact-voucher-institution.entity';

export interface LinkedChildItem {
  linkageId: string;
  status: string;
  // 아동 정보
  childId: string;
  childName: string;
  childAge: number;
  childGender: string;
  // 상담의뢰 정보
  counselRequestId: string;
  careType: string;
  centerName: string;
  centerPhone: string;
  requestDate: string;
  // AI 추천 정보
  recommendationScore?: number;
  recommendationReason?: string;
  // 기관 검토 정보
  institutionReviewedAt?: string;
  institutionRejectionReason?: string;
  // 메타
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class GetLinkedChildrenUseCase {
  constructor(
    @Inject(VOUCHER_LINKAGE_REPOSITORY)
    private readonly voucherLinkageRepository: VoucherLinkageRepository,
    @InjectRepository(CounselRequestEntity)
    private readonly counselRequestRepository: Repository<CounselRequestEntity>,
    @InjectRepository(CounselRequestRecommendationEntity)
    private readonly recommendationRepository: Repository<CounselRequestRecommendationEntity>,
    @InjectRepository(BImpactVoucherInstitutionEntity)
    private readonly bImpactRepository: Repository<BImpactVoucherInstitutionEntity>,
  ) {}

  async execute(institutionId: string): Promise<LinkedChildItem[]> {
    // 1. 해당 기관의 연계 목록 조회
    const linkages = await this.voucherLinkageRepository.findByLinkedVoucherInstitutionId(institutionId);

    if (linkages.length === 0) {
      return [];
    }

    // 2. 상담의뢰지 ID 목록 추출
    const counselRequestIds = linkages.map((l) => l.counselRequestId);

    // 3. 상담의뢰지 + 아동 정보 조회 (연계 기관 연락처를 위해 센터 조인)
    const counselRequests = await this.counselRequestRepository
      .createQueryBuilder('cr')
      .leftJoinAndSelect('cr.child', 'child')
      .leftJoinAndSelect('child.communityChildCenter', 'center')
      .leftJoinAndSelect('child.careFacility', 'facility')
      .whereInIds(counselRequestIds)
      .getMany();

    const counselRequestMap = new Map(counselRequests.map((cr) => [cr.id, cr]));

    // 4. AI 추천 정보 조회 (해당 기관에 대한 추천)
    const recommendations = await this.recommendationRepository
      .createQueryBuilder('rec')
      .where('rec.counselRequestId IN (:...ids)', { ids: counselRequestIds })
      .andWhere('rec.institutionId = :institutionId', { institutionId })
      .getMany();

    const recommendationMap = new Map(recommendations.map((rec) => [rec.counselRequestId, rec]));

    // 5. 결과 조합
    return linkages.map((linkage) => {
      const counselRequest = counselRequestMap.get(linkage.counselRequestId);
      const recommendation = recommendationMap.get(linkage.counselRequestId);

      const childName = counselRequest?.formData?.basicInfo?.childInfo?.name || '알 수 없음';
      const childAge = counselRequest?.formData?.basicInfo?.childInfo?.age || 0;
      const childGender = counselRequest?.formData?.basicInfo?.childInfo?.gender || '알 수 없음';

      // 의뢰 기관 연락처: formData.institutionInfo > 센터 엔티티 순으로 조회
      const centerPhone =
        counselRequest?.formData?.institutionInfo?.phoneNumber ||
        counselRequest?.child?.communityChildCenter?.phoneNumber ||
        counselRequest?.child?.careFacility?.phoneNumber ||
        '';

      return {
        linkageId: linkage.id,
        status: linkage.status,
        childId: counselRequest?.childId || '',
        childName,
        childAge,
        childGender,
        counselRequestId: linkage.counselRequestId,
        careType: counselRequest?.careType || '',
        centerName: counselRequest?.centerName || '',
        centerPhone,
        requestDate: counselRequest?.requestDate?.toISOString?.() || counselRequest?.createdAt?.toISOString?.() || '',
        recommendationScore: recommendation ? Number(recommendation.score) : undefined,
        recommendationReason: recommendation?.reason,
        institutionReviewedAt: linkage.institutionReviewedAt?.toISOString(),
        institutionRejectionReason: linkage.institutionRejectionReason,
        createdAt: linkage.createdAt.toISOString(),
        updatedAt: linkage.updatedAt.toISOString(),
      };
    });
  }
}
