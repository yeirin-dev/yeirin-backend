import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CounselorProfileRepository } from '@domain/counselor/repository/counselor-profile.repository';
import { CounselorProfileResponseDto } from '../dto/counselor-profile-response.dto';

/**
 * 상담사 프로필 단건 조회 유스케이스
 */
@Injectable()
export class GetCounselorProfileUseCase {
  constructor(
    @Inject('CounselorProfileRepository')
    private readonly counselorProfileRepository: CounselorProfileRepository,
  ) {}

  async execute(id: string): Promise<CounselorProfileResponseDto> {
    const profile = await this.counselorProfileRepository.findById(id);

    if (!profile) {
      throw new NotFoundException(`상담사 프로필을 찾을 수 없습니다 (ID: ${id})`);
    }

    return {
      id: profile.id,
      institutionId: profile.institutionId,
      institutionName: profile.institution?.centerName || '',
      name: profile.name,
      experienceYears: profile.experienceYears,
      certifications: profile.certifications,
      specialties: profile.specialties || [],
      introduction: profile.introduction || '',
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
