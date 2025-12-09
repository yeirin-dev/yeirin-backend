import { Test, TestingModule } from '@nestjs/testing';
import { CounselorProfileRepository } from '@domain/counselor/repository/counselor-profile.repository';
import { CreateCounselorProfileDto } from '../dto/create-counselor-profile.dto';
import { CreateCounselorProfileUseCase } from './create-counselor-profile.usecase';

describe('CreateCounselorProfileUseCase', () => {
  let useCase: CreateCounselorProfileUseCase;
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
        CreateCounselorProfileUseCase,
        {
          provide: 'CounselorProfileRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateCounselorProfileUseCase>(CreateCounselorProfileUseCase);
  });

  describe('상담사 프로필 생성', () => {
    it('유효한 정보로 상담사 프로필을 생성한다', async () => {
      // Given
      const dto: CreateCounselorProfileDto = {
        userId: 'user-123',
        institutionId: 'institution-123',
        name: '김상담',
        experienceYears: 5,
        certifications: ['임상심리전문가', '청소년상담사 1급'],
        specialties: ['불안장애', '우울증'],
        introduction: '10년 경력의 청소년 상담 전문가입니다.',
      };

      const createdProfile = {
        id: 'profile-123',
        userId: dto.userId,
        institutionId: dto.institutionId,
        name: dto.name,
        experienceYears: dto.experienceYears,
        certifications: dto.certifications,
        specialties: dto.specialties,
        introduction: dto.introduction,
        institution: { centerName: '행복 상담센터' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockResolvedValue(createdProfile as any);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.name).toBe('김상담');
      expect(result.experienceYears).toBe(5);
      expect(result.certifications).toContain('임상심리전문가');
      expect(result.institutionName).toBe('행복 상담센터');
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('선택적 필드 없이 최소 정보로 생성할 수 있다', async () => {
      // Given
      const dto: CreateCounselorProfileDto = {
        userId: 'user-456',
        institutionId: 'institution-456',
        name: '이상담',
        experienceYears: 2,
        certifications: ['청소년상담사 2급'],
      };

      const createdProfile = {
        id: 'profile-456',
        userId: dto.userId,
        institutionId: dto.institutionId,
        name: dto.name,
        experienceYears: dto.experienceYears,
        certifications: dto.certifications,
        specialties: [],
        introduction: '',
        institution: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockResolvedValue(createdProfile as any);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.name).toBe('이상담');
      expect(result.specialties).toEqual([]);
      expect(result.introduction).toBe('');
      expect(result.institutionName).toBe('');
    });

    it('신규 상담사는 경력이 0년일 수 있다', async () => {
      // Given
      const dto: CreateCounselorProfileDto = {
        userId: 'user-789',
        institutionId: 'institution-789',
        name: '박상담',
        experienceYears: 0,
        certifications: ['상담심리사 2급'],
      };

      const createdProfile = {
        id: 'profile-789',
        userId: dto.userId,
        institutionId: dto.institutionId,
        name: dto.name,
        experienceYears: 0,
        certifications: dto.certifications,
        specialties: [],
        introduction: '',
        institution: { centerName: '새싹 상담센터' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockResolvedValue(createdProfile as any);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.experienceYears).toBe(0);
    });
  });

  describe('응답 DTO 변환', () => {
    it('CounselorProfile을 CounselorProfileResponseDto로 변환한다', async () => {
      // Given
      const dto: CreateCounselorProfileDto = {
        userId: 'user-123',
        institutionId: 'institution-123',
        name: '최상담',
        experienceYears: 10,
        certifications: ['임상심리전문가'],
        specialties: ['ADHD', '학습장애'],
        introduction: '아동 전문 상담사입니다.',
      };

      const createdProfile = {
        id: 'profile-test',
        userId: dto.userId,
        institutionId: dto.institutionId,
        name: dto.name,
        experienceYears: dto.experienceYears,
        certifications: dto.certifications,
        specialties: dto.specialties,
        introduction: dto.introduction,
        institution: { centerName: '테스트 센터' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockResolvedValue(createdProfile as any);

      // When
      const result = await useCase.execute(dto);

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
