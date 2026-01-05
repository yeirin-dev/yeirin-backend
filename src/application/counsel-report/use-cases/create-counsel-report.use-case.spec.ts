import { Test, TestingModule } from '@nestjs/testing';
import { CounselReport } from '@domain/counsel-report/model/counsel-report';
import { ReportStatus } from '@domain/counsel-report/model/value-objects/report-status';
import { CounselReportRepository } from '@domain/counsel-report/repository/counsel-report.repository';
import { CreateCounselReportDto } from '../dto/create-counsel-report.dto';
import { CreateCounselReportUseCase } from './create-counsel-report.use-case';

describe('CreateCounselReportUseCase', () => {
  let useCase: CreateCounselReportUseCase;
  let mockRepository: jest.Mocked<CounselReportRepository>;

  beforeEach(async () => {
    // Mock Repository 생성
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCounselRequestIdAndSession: jest.fn(),
      findByCounselRequestId: jest.fn(),
      findByChildId: jest.fn(),
      findByCounselorId: jest.fn(),
      findByInstitutionId: jest.fn(),
      findByStatus: jest.fn(),
      findByGuardianId: jest.fn(),
      delete: jest.fn(),
      getNextSessionNumber: jest.fn(),
      countByCounselRequestId: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCounselReportUseCase,
        {
          provide: 'CounselReportRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateCounselReportUseCase>(CreateCounselReportUseCase);
  });

  const validDto: CreateCounselReportDto = {
    counselRequestId: '123e4567-e89b-12d3-a456-426614174000',
    childId: '123e4567-e89b-12d3-a456-426614174001',
    sessionNumber: 1,
    reportDate: new Date('2025-01-15'),
    centerName: '행복한 심리상담센터',
    counselorSignature: undefined,
    counselReason: 'ADHD 진단 후 집중력 향상을 위한 심리 상담',
    counselContent: '아동과의 1:1 대화를 통해 최근 학교생활에서의 어려움을 탐색하였습니다.',
    centerFeedback: undefined,
    homeFeedback: undefined,
    attachmentUrls: undefined,
  };

  const counselorId = '123e4567-e89b-12d3-a456-426614174002';
  const institutionId = '123e4567-e89b-12d3-a456-426614174003';

  describe('면담결과지 생성', () => {
    it('유효한 정보로 면담결과지를 생성한다', async () => {
      // Given
      mockRepository.findByCounselRequestIdAndSession.mockResolvedValue(null);
      mockRepository.save.mockImplementation(async (report) => report);

      // When
      const result = await useCase.execute(validDto, counselorId, institutionId);

      // Then
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response.status).toBe(ReportStatus.DRAFT);
      expect(response.sessionNumber).toBe(1);
      expect(response.counselorId).toBe(counselorId);
      expect(response.institutionId).toBe(institutionId);

      expect(mockRepository.findByCounselRequestIdAndSession).toHaveBeenCalledWith(
        validDto.counselRequestId,
        validDto.sessionNumber,
      );
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('같은 의뢰지의 같은 회차가 이미 존재하면 실패한다', async () => {
      // Given
      const existingReport = CounselReport.create({
        counselRequestId: validDto.counselRequestId,
        childId: validDto.childId,
        counselorId,
        institutionId,
        sessionNumber: validDto.sessionNumber,
        reportDate: validDto.reportDate,
        centerName: validDto.centerName,
        counselorSignature: null,
        counselReason: validDto.counselReason,
        counselContent: validDto.counselContent,
        centerFeedback: null,
        homeFeedback: null,
        attachmentUrls: [],
      }).getValue();

      mockRepository.findByCounselRequestIdAndSession.mockResolvedValue(existingReport);

      // When
      const result = await useCase.execute(validDto, counselorId, institutionId);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('DUPLICATE_SESSION_NUMBER');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('필수 필드가 누락되면 생성에 실패한다', async () => {
      // Given
      const invalidDto = { ...validDto, counselReason: '   ' };
      mockRepository.findByCounselRequestIdAndSession.mockResolvedValue(null);

      // When
      const result = await useCase.execute(invalidDto, counselorId, institutionId);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('MISSING_COUNSEL_CONTENT');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('응답 DTO 변환', () => {
    it('CounselReport을 CounselReportResponseDto로 변환한다', async () => {
      // Given
      mockRepository.findByCounselRequestIdAndSession.mockResolvedValue(null);
      mockRepository.save.mockImplementation(async (report) => report);

      // When
      const result = await useCase.execute(validDto, counselorId, institutionId);

      // Then
      expect(result.isSuccess).toBe(true);
      const response = result.getValue();
      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('counselRequestId');
      expect(response).toHaveProperty('childId');
      expect(response).toHaveProperty('counselorId');
      expect(response).toHaveProperty('institutionId');
      expect(response).toHaveProperty('sessionNumber');
      expect(response).toHaveProperty('status');
      expect(response).toHaveProperty('createdAt');
      expect(response).toHaveProperty('updatedAt');
    });
  });
});
