import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CounselorProfileRepository } from '@domain/counselor/repository/counselor-profile.repository';
import { GetCounselorProfileUseCase } from './get-counselor-profile.usecase';

describe('GetCounselorProfileUseCase', () => {
  let useCase: GetCounselorProfileUseCase;
  let mockRepository: jest.Mocked<CounselorProfileRepository>;

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByInstitutionId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findBySpecialty: jest.fn(),
      findByMinExperience: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCounselorProfileUseCase,
        {
          provide: 'CounselorProfileRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetCounselorProfileUseCase>(GetCounselorProfileUseCase);
  });

  const createMockProfile = (id: string) => ({
    id,
    userId: 'user-123',
    institutionId: 'institution-123',
    name: '김상담',
    experienceYears: 5,
    certifications: ['임상심리전문가', '청소년상담사 1급'],
    specialties: ['불안장애', '우울증'],
    introduction: '10년 경력의 청소년 상담 전문가입니다.',
    institution: { centerName: '행복 상담센터' },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('상담사 프로필 단건 조회', () => {
    it('ID로 상담사 프로필을 조회한다', async () => {
      // Given
      const profileId = 'profile-123';
      const mockProfile = createMockProfile(profileId);
      mockRepository.findById.mockResolvedValue(mockProfile as any);

      // When
      const result = await useCase.execute(profileId);

      // Then
      expect(result.id).toBe(profileId);
      expect(result.name).toBe('김상담');
      expect(result.institutionName).toBe('행복 상담센터');
      expect(mockRepository.findById).toHaveBeenCalledWith(profileId);
    });

    it('존재하지 않는 ID로 조회시 NotFoundException을 던진다', async () => {
      // Given
      const profileId = 'non-existent-id';
      mockRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(useCase.execute(profileId)).rejects.toThrow(NotFoundException);
      expect(mockRepository.findById).toHaveBeenCalledWith(profileId);
    });

    it('소속 기관이 없으면 기관명은 빈 문자열이다', async () => {
      // Given
      const profileId = 'profile-no-institution';
      const mockProfile = createMockProfile(profileId);
      (mockProfile as any).institution = undefined;
      mockRepository.findById.mockResolvedValue(mockProfile as any);

      // When
      const result = await useCase.execute(profileId);

      // Then
      expect(result.institutionName).toBe('');
    });

    it('전문 분야가 없으면 빈 배열을 반환한다', async () => {
      // Given
      const profileId = 'profile-no-specialties';
      const mockProfile = createMockProfile(profileId);
      (mockProfile as any).specialties = undefined;
      mockRepository.findById.mockResolvedValue(mockProfile as any);

      // When
      const result = await useCase.execute(profileId);

      // Then
      expect(result.specialties).toEqual([]);
    });
  });

  describe('응답 DTO 변환', () => {
    it('CounselorProfile을 CounselorProfileResponseDto로 변환한다', async () => {
      // Given
      const profileId = 'profile-123';
      const mockProfile = createMockProfile(profileId);
      mockRepository.findById.mockResolvedValue(mockProfile as any);

      // When
      const result = await useCase.execute(profileId);

      // Then
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('institutionId');
      expect(result).toHaveProperty('institutionName');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('experienceYears');
      expect(result).toHaveProperty('certifications');
      expect(result).toHaveProperty('specialties');
      expect(result).toHaveProperty('introduction');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });
  });
});
