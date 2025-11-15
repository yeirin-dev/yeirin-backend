import { Injectable } from '@nestjs/common';
import { InstitutionRepository } from '@domain/institution/repository/institution.repository';
import { InstitutionListResponseDto, InstitutionResponseDto } from '../dto/institution-response.dto';

/**
 * 바우처 기관 목록 조회 유스케이스
 */
@Injectable()
export class GetInstitutionsUseCase {
  constructor(private readonly institutionRepository: InstitutionRepository) {}

  async execute(page: number = 1, limit: number = 10): Promise<InstitutionListResponseDto> {
    const [institutions, total] = await this.institutionRepository.findAll(page, limit);

    const institutionDtos: InstitutionResponseDto[] = institutions.map((institution) => {
      const averageRating =
        institution.reviews && institution.reviews.length > 0
          ? institution.reviews.reduce((sum, review) => sum + review.rating, 0) / institution.reviews.length
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
    });

    return {
      institutions: institutionDtos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
