import { Injectable, Inject } from '@nestjs/common';
import { CounselorProfileRepository } from '@domain/counselor/repository/counselor-profile.repository';
import { CreateCounselorProfileDto } from '../dto/create-counselor-profile.dto';
import { CounselorProfileResponseDto } from '../dto/counselor-profile-response.dto';

/**
 * 상담사 프로필 생성 유스케이스
 */
@Injectable()
export class CreateCounselorProfileUseCase {
  constructor(
    @Inject('CounselorProfileRepository')
    private readonly counselorProfileRepository: CounselorProfileRepository,
  ) {}

  async execute(dto: CreateCounselorProfileDto): Promise<CounselorProfileResponseDto> {
    const profile = await this.counselorProfileRepository.create({
      userId: dto.userId,
      institutionId: dto.institutionId,
      name: dto.name,
      experienceYears: dto.experienceYears,
      certifications: dto.certifications,
      specialties: dto.specialties || [],
      introduction: dto.introduction || '',
    });

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
