import { Injectable, NotFoundException } from '@nestjs/common';
import { InstitutionRepository } from '@domain/institution/repository/institution.repository';
import { InstitutionResponseDto } from '../dto/institution-response.dto';

/**
 * 바우처 기관 단건 조회 유스케이스
 */
@Injectable()
export class GetInstitutionUseCase {
  constructor(private readonly institutionRepository: InstitutionRepository) {}

  async execute(id: string): Promise<InstitutionResponseDto> {
    const institution = await this.institutionRepository.findById(id);

    if (!institution) {
      throw new NotFoundException(`기관을 찾을 수 없습니다 (ID: ${id})`);
    }

    // 평균 평점 계산
    const averageRating =
      institution.reviews && institution.reviews.length > 0
        ? institution.reviews.reduce((sum, review) => sum + review.rating, 0) /
          institution.reviews.length
        : 0;

    return {
      id: institution.id,
      centerName: institution.centerName,
      representativeName: institution.representativeName,
      address: institution.address,
      establishedDate: institution.establishedDate.toISOString().split('T')[0],
      operatingVouchers: institution.operatingVouchers,
      providedServices: institution.providedServices,
      specialTreatments: institution.specialTreatments,
      isQualityCertified: institution.isQualityCertified,
      averageRating: Math.round(averageRating * 10) / 10,
      counselorCount: institution.counselorProfiles?.length || 0,
      reviewCount: institution.reviews?.length || 0,
      createdAt: institution.createdAt,
      updatedAt: institution.updatedAt,
    };
  }
}
