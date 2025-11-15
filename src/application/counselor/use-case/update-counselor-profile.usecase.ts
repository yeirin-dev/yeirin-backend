import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CounselorProfileRepository } from '@domain/counselor/repository/counselor-profile.repository';
import { UpdateCounselorProfileDto } from '../dto/update-counselor-profile.dto';
import { CounselorProfileResponseDto } from '../dto/counselor-profile-response.dto';

/**
 * 상담사 프로필 수정 유스케이스
 */
@Injectable()
export class UpdateCounselorProfileUseCase {
  constructor(
    @Inject('CounselorProfileRepository')
    private readonly counselorProfileRepository: CounselorProfileRepository,
  ) {}

  async execute(id: string, dto: UpdateCounselorProfileDto): Promise<CounselorProfileResponseDto> {
    // 상담사 존재 확인
    const existing = await this.counselorProfileRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`상담사 프로필을 찾을 수 없습니다 (ID: ${id})`);
    }

    // 업데이트 데이터 준비
    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.experienceYears !== undefined) updateData.experienceYears = dto.experienceYears;
    if (dto.certifications) updateData.certifications = dto.certifications;
    if (dto.specialties) updateData.specialties = dto.specialties;
    if (dto.introduction !== undefined) updateData.introduction = dto.introduction;

    const updated = await this.counselorProfileRepository.update(id, updateData);

    return {
      id: updated.id,
      institutionId: updated.institutionId,
      institutionName: updated.institution?.centerName || '',
      name: updated.name,
      experienceYears: updated.experienceYears,
      certifications: updated.certifications,
      specialties: updated.specialties || [],
      introduction: updated.introduction || '',
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
