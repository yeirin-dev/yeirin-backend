import { Injectable, Inject } from '@nestjs/common';
import { CounselorProfileRepository } from '@domain/counselor/repository/counselor-profile.repository';
import {
  CounselorProfileListResponseDto,
  CounselorProfileResponseDto,
} from '../dto/counselor-profile-response.dto';

/**
 * 상담사 프로필 목록 조회 유스케이스
 */
@Injectable()
export class GetCounselorProfilesUseCase {
  constructor(
    @Inject('CounselorProfileRepository')
    private readonly counselorProfileRepository: CounselorProfileRepository,
  ) {}

  async execute(page: number = 1, limit: number = 10): Promise<CounselorProfileListResponseDto> {
    const [profiles, total] = await this.counselorProfileRepository.findAll(page, limit);

    const counselorDtos: CounselorProfileResponseDto[] = profiles.map((profile) => ({
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
    }));

    return {
      counselors: counselorDtos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
