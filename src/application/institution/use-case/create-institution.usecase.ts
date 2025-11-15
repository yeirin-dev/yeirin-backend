import { Injectable } from '@nestjs/common';
import { InstitutionRepository } from '@domain/institution/repository/institution.repository';
import { CreateInstitutionDto } from '../dto/create-institution.dto';
import { InstitutionResponseDto } from '../dto/institution-response.dto';

/**
 * 바우처 기관 생성 유스케이스
 */
@Injectable()
export class CreateInstitutionUseCase {
  constructor(private readonly institutionRepository: InstitutionRepository) {}

  async execute(dto: CreateInstitutionDto): Promise<InstitutionResponseDto> {
    const institution = await this.institutionRepository.create({
      userId: dto.userId,
      centerName: dto.centerName,
      representativeName: dto.representativeName,
      address: dto.address,
      establishedDate: new Date(dto.establishedDate),
      operatingVouchers: dto.operatingVouchers as any,
      isQualityCertified: dto.isQualityCertified,
      maxCapacity: dto.maxCapacity,
      introduction: dto.introduction,
      counselorCount: 0, // 초기값
      counselorCertifications: [], // 초기값
      primaryTargetGroup: dto.primaryTargetGroup,
      secondaryTargetGroup: dto.secondaryTargetGroup || '',
      canProvideComprehensiveTest: dto.canProvideComprehensiveTest,
      providedServices: dto.providedServices as any,
      specialTreatments: dto.specialTreatments as any,
      canProvideParentCounseling: dto.canProvideParentCounseling,
      averageRating: 0, // 초기값
      reviewCount: 0, // 초기값
    });

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
      averageRating: 0,
      counselorCount: 0,
      reviewCount: 0,
      createdAt: institution.createdAt,
      updatedAt: institution.updatedAt,
    };
  }
}
