import { Injectable, NotFoundException } from '@nestjs/common';
import { InstitutionRepository } from '@domain/institution/repository/institution.repository';
import { UpdateInstitutionDto } from '../dto/update-institution.dto';
import { InstitutionResponseDto } from '../dto/institution-response.dto';

/**
 * 바우처 기관 수정 유스케이스
 */
@Injectable()
export class UpdateInstitutionUseCase {
  constructor(private readonly institutionRepository: InstitutionRepository) {}

  async execute(id: string, dto: UpdateInstitutionDto): Promise<InstitutionResponseDto> {
    // 기관 존재 확인
    const existing = await this.institutionRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`기관을 찾을 수 없습니다 (ID: ${id})`);
    }

    // 업데이트 데이터 준비
    const updateData: any = {};
    if (dto.centerName) updateData.centerName = dto.centerName;
    if (dto.representativeName) updateData.representativeName = dto.representativeName;
    if (dto.address) updateData.address = dto.address;
    if (dto.establishedDate) updateData.establishedDate = new Date(dto.establishedDate);
    if (dto.operatingVouchers) updateData.operatingVouchers = dto.operatingVouchers;
    if (dto.isQualityCertified !== undefined) updateData.isQualityCertified = dto.isQualityCertified;
    if (dto.maxCapacity) updateData.maxCapacity = dto.maxCapacity;
    if (dto.introduction) updateData.introduction = dto.introduction;
    if (dto.primaryTargetGroup) updateData.primaryTargetGroup = dto.primaryTargetGroup;
    if (dto.secondaryTargetGroup) updateData.secondaryTargetGroup = dto.secondaryTargetGroup;
    if (dto.canProvideComprehensiveTest !== undefined)
      updateData.canProvideComprehensiveTest = dto.canProvideComprehensiveTest;
    if (dto.providedServices) updateData.providedServices = dto.providedServices;
    if (dto.specialTreatments) updateData.specialTreatments = dto.specialTreatments;
    if (dto.canProvideParentCounseling !== undefined)
      updateData.canProvideParentCounseling = dto.canProvideParentCounseling;

    const updated = await this.institutionRepository.update(id, updateData);

    // 평균 평점 계산
    const averageRating =
      updated.reviews && updated.reviews.length > 0
        ? updated.reviews.reduce((sum, review) => sum + review.rating, 0) / updated.reviews.length
        : 0;

    return {
      id: updated.id,
      centerName: updated.centerName,
      representativeName: updated.representativeName,
      address: updated.address,
      establishedDate: updated.establishedDate.toISOString().split('T')[0],
      operatingVouchers: updated.operatingVouchers,
      providedServices: updated.providedServices,
      specialTreatments: updated.specialTreatments,
      isQualityCertified: updated.isQualityCertified,
      averageRating: Math.round(averageRating * 10) / 10,
      counselorCount: updated.counselorProfiles?.length || 0,
      reviewCount: updated.reviews?.length || 0,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
