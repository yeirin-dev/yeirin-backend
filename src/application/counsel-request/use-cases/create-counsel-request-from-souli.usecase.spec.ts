import { Test, TestingModule } from '@nestjs/testing';
import {
  CareType,
  ConsentStatus,
  CounselRequestStatus,
  Gender,
  ProtectedChildType,
  ProtectedChildReason,
} from '@domain/counsel-request/model/value-objects/counsel-request-enums';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { SoulEClient } from '@infrastructure/external/soul-e.client';
import { YeirinAIClient } from '@infrastructure/external/yeirin-ai.client';
import { SouliWebhookDto } from '../dto/souli-webhook.dto';
import { CreateCounselRequestFromSouliUseCase } from './create-counsel-request-from-souli.usecase';

describe('CreateCounselRequestFromSouliUseCase', () => {
  let useCase: CreateCounselRequestFromSouliUseCase;
  let mockRepository: jest.Mocked<CounselRequestRepository>;
  let mockYeirinAIClient: jest.Mocked<YeirinAIClient>;
  let mockSoulEClient: jest.Mocked<SoulEClient>;

  beforeEach(async () => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByChildId: jest.fn(),
      findByGuardianId: jest.fn(),
      findByStatus: jest.fn(),
      findByInstitutionId: jest.fn(),
      findByCounselorId: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      countByGuardianIdAndStatus: jest.fn(),
      findRecentByGuardianId: jest.fn(),
    };

    mockYeirinAIClient = {
      requestIntegratedReport: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<YeirinAIClient>;

    mockSoulEClient = {
      getLatestAssessmentResult: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<SoulEClient>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCounselRequestFromSouliUseCase,
        {
          provide: 'CounselRequestRepository',
          useValue: mockRepository,
        },
        {
          provide: YeirinAIClient,
          useValue: mockYeirinAIClient,
        },
        {
          provide: SoulEClient,
          useValue: mockSoulEClient,
        },
      ],
    }).compile();

    useCase = module.get<CreateCounselRequestFromSouliUseCase>(
      CreateCounselRequestFromSouliUseCase,
    );
  });

  const createBaseWebhookDto = (): SouliWebhookDto => ({
    souliSessionId: 'souli-session-12345',
    childId: '123e4567-e89b-12d3-a456-426614174001',
    guardianId: '123e4567-e89b-12d3-a456-426614174002',
    coverInfo: {
      requestDate: { year: 2025, month: 1, day: 15 },
      centerName: '행복한 지역아동센터',
      counselorName: '김담당',
    },
    basicInfo: {
      childInfo: {
        name: '홍길동',
        gender: Gender.MALE,
        age: 10,
        grade: '초4',
      },
      careType: CareType.GENERAL,
    },
    psychologicalInfo: {
      medicalHistory: '없음',
      specialNotes: '특이사항 없음',
    },
    requestMotivation: {
      motivation: '또래 관계에서 어려움을 겪고 있어 상담 의뢰합니다.',
      goals: '또래 관계 개선 및 자존감 향상',
    },
    testResults: {},
    consent: ConsentStatus.AGREED,
  });

  describe('상담의뢰지 생성', () => {
    it('유효한 webhook 요청으로 상담의뢰지를 생성한다', async () => {
      // Given
      const dto = createBaseWebhookDto();
      mockRepository.save.mockImplementation(async (request) => request);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result).toBeDefined();
      expect(result.childId).toBe(dto.childId);
      expect(result.guardianId).toBe(dto.guardianId);
      expect(result.status).toBe(CounselRequestStatus.PENDING);
      expect(result.centerName).toBe('행복한 지역아동센터');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('생성된 상담의뢰지는 PENDING 상태이다', async () => {
      // Given
      const dto = createBaseWebhookDto();
      mockRepository.save.mockImplementation(async (request) => request);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.status).toBe(CounselRequestStatus.PENDING);
    });
  });

  describe('보호대상 아동 정보 처리', () => {
    it('보호대상 아동 정보가 있으면 yeirin-ai에 전달한다', async () => {
      // Given
      const dto = createBaseWebhookDto();
      dto.basicInfo.protectedChildInfo = {
        type: ProtectedChildType.CHILD_FACILITY,
        reason: ProtectedChildReason.GUARDIAN_ABSENCE,
      };
      dto.testResults = {
        attachedAssessments: [
          {
            assessmentType: 'KPRC_CO_SG_E',
            assessmentName: 'KPRC 인성평정척도',
            resultId: 'result-123',
            reportS3Key: 'reports/kprc.pdf',
          },
        ],
      };
      mockRepository.save.mockImplementation(async (request) => request);

      // When
      await useCase.execute(dto);

      // Then
      expect(mockYeirinAIClient.requestIntegratedReport).toHaveBeenCalledWith(
        expect.objectContaining({
          basic_info: expect.objectContaining({
            protectedChildInfo: {
              type: ProtectedChildType.CHILD_FACILITY,
              reason: ProtectedChildReason.GUARDIAN_ABSENCE,
            },
          }),
        }),
      );
    });

    it('공동생활가정(그룹홈) 유형을 올바르게 처리한다', async () => {
      // Given
      const dto = createBaseWebhookDto();
      dto.basicInfo.protectedChildInfo = {
        type: ProtectedChildType.GROUP_HOME,
        reason: ProtectedChildReason.ABUSE,
      };
      dto.testResults = {
        attachedAssessments: [
          {
            assessmentType: 'KPRC_CO_SG_E',
            assessmentName: 'KPRC',
            resultId: 'result-123',
            reportS3Key: 'reports/kprc.pdf',
          },
        ],
      };
      mockRepository.save.mockImplementation(async (request) => request);

      // When
      await useCase.execute(dto);

      // Then
      expect(mockYeirinAIClient.requestIntegratedReport).toHaveBeenCalledWith(
        expect.objectContaining({
          basic_info: expect.objectContaining({
            protectedChildInfo: {
              type: ProtectedChildType.GROUP_HOME,
              reason: ProtectedChildReason.ABUSE,
            },
          }),
        }),
      );
    });
  });

  describe('검사 결과 처리 (attachedAssessments)', () => {
    it('KPRC 검사 결과를 attached_assessments로 전달한다', async () => {
      // Given
      const dto = createBaseWebhookDto();
      dto.testResults = {
        attachedAssessments: [
          {
            assessmentType: 'KPRC_CO_SG_E',
            assessmentName: 'KPRC 인성평정척도',
            resultId: 'kprc-result-123',
            reportS3Key: 'reports/KPRC_홍길동.pdf',
            summary: {
              summaryLines: ['전반적 적응 양호'],
              expertOpinion: '정서적 안정감이 높습니다.',
              keyFindings: ['적응 양호', '또래 관계 어려움'],
              recommendations: ['사회성 프로그램 권장'],
              confidenceScore: 0.85,
            },
          },
        ],
      };
      mockRepository.save.mockImplementation(async (request) => request);

      // When
      await useCase.execute(dto);

      // Then
      expect(mockYeirinAIClient.requestIntegratedReport).toHaveBeenCalledWith(
        expect.objectContaining({
          attached_assessments: expect.arrayContaining([
            expect.objectContaining({
              assessmentType: 'KPRC_CO_SG_E',
              assessmentName: 'KPRC 인성평정척도',
              resultId: 'kprc-result-123',
              reportS3Key: 'reports/KPRC_홍길동.pdf',
            }),
          ]),
        }),
      );
    });

    it('CRTES-R 검사 결과를 attached_assessments로 전달한다', async () => {
      // Given
      const dto = createBaseWebhookDto();
      dto.testResults = {
        attachedAssessments: [
          {
            assessmentType: 'CRTES_R',
            assessmentName: '아동 외상 반응 척도',
            resultId: 'crtes-result-123',
            totalScore: 45,
            maxScore: 115,
            overallLevel: 'caution',
          },
        ],
      };
      mockRepository.save.mockImplementation(async (request) => request);

      // When
      await useCase.execute(dto);

      // Then
      expect(mockYeirinAIClient.requestIntegratedReport).toHaveBeenCalledWith(
        expect.objectContaining({
          attached_assessments: expect.arrayContaining([
            expect.objectContaining({
              assessmentType: 'CRTES_R',
              assessmentName: '아동 외상 반응 척도',
              totalScore: 45,
              maxScore: 115,
              overallLevel: 'caution',
            }),
          ]),
        }),
      );
    });

    it('SDQ-A 검사 결과를 attached_assessments로 전달한다', async () => {
      // Given
      const dto = createBaseWebhookDto();
      dto.testResults = {
        attachedAssessments: [
          {
            assessmentType: 'SDQ_A',
            assessmentName: '강점·난점 설문지',
            resultId: 'sdq-result-123',
            totalScore: 18,
            maxScore: 40,
            overallLevel: 'normal',
          },
        ],
      };
      mockRepository.save.mockImplementation(async (request) => request);

      // When
      await useCase.execute(dto);

      // Then
      expect(mockYeirinAIClient.requestIntegratedReport).toHaveBeenCalledWith(
        expect.objectContaining({
          attached_assessments: expect.arrayContaining([
            expect.objectContaining({
              assessmentType: 'SDQ_A',
              assessmentName: '강점·난점 설문지',
            }),
          ]),
        }),
      );
    });

    it('여러 검사 결과(KPRC, CRTES-R, SDQ-A)를 모두 전달한다', async () => {
      // Given
      const dto = createBaseWebhookDto();
      dto.testResults = {
        attachedAssessments: [
          {
            assessmentType: 'KPRC_CO_SG_E',
            assessmentName: 'KPRC',
            resultId: 'kprc-123',
            reportS3Key: 'reports/kprc.pdf',
          },
          {
            assessmentType: 'CRTES_R',
            assessmentName: 'CRTES-R',
            resultId: 'crtes-123',
            totalScore: 30,
          },
          {
            assessmentType: 'SDQ_A',
            assessmentName: 'SDQ-A',
            resultId: 'sdq-123',
            totalScore: 22,
          },
        ],
      };
      mockRepository.save.mockImplementation(async (request) => request);

      // When
      await useCase.execute(dto);

      // Then
      expect(mockYeirinAIClient.requestIntegratedReport).toHaveBeenCalledWith(
        expect.objectContaining({
          attached_assessments: expect.arrayContaining([
            expect.objectContaining({ assessmentType: 'KPRC_CO_SG_E' }),
            expect.objectContaining({ assessmentType: 'CRTES_R' }),
            expect.objectContaining({ assessmentType: 'SDQ_A' }),
          ]),
        }),
      );
    });
  });

  describe('하위 호환성 (Legacy 필드)', () => {
    it('legacy kprcSummary 필드를 kprc_summary로 변환하여 전달한다', async () => {
      // Given
      const dto = createBaseWebhookDto();
      dto.testResults = {
        assessmentReportS3Key: 'reports/legacy_kprc.pdf',
        kprcSummary: {
          summaryLines: ['Legacy 요약'],
          expertOpinion: 'Legacy 소견',
          keyFindings: ['발견1'],
          recommendations: ['권장1'],
          confidenceScore: 0.8,
        },
      };
      mockRepository.save.mockImplementation(async (request) => request);

      // When
      await useCase.execute(dto);

      // Then
      expect(mockYeirinAIClient.requestIntegratedReport).toHaveBeenCalledWith(
        expect.objectContaining({
          kprc_summary: expect.objectContaining({
            summaryLines: ['Legacy 요약'],
            expertOpinion: 'Legacy 소견',
          }),
          assessment_report_s3_key: 'reports/legacy_kprc.pdf',
        }),
      );
    });

    it('attachedAssessments가 있으면 legacy 필드보다 우선한다', async () => {
      // Given
      const dto = createBaseWebhookDto();
      dto.testResults = {
        attachedAssessments: [
          {
            assessmentType: 'KPRC_CO_SG_E',
            assessmentName: 'KPRC',
            resultId: 'new-123',
            reportS3Key: 'reports/new_kprc.pdf',
            summary: {
              expertOpinion: '새 방식 소견',
            },
          },
        ],
        // Legacy 필드도 있음
        assessmentReportS3Key: 'reports/legacy_kprc.pdf',
        kprcSummary: {
          expertOpinion: 'Legacy 소견',
        },
      };
      mockRepository.save.mockImplementation(async (request) => request);

      // When
      await useCase.execute(dto);

      // Then
      expect(mockYeirinAIClient.requestIntegratedReport).toHaveBeenCalledWith(
        expect.objectContaining({
          attached_assessments: expect.arrayContaining([
            expect.objectContaining({
              reportS3Key: 'reports/new_kprc.pdf',
            }),
          ]),
          // kprc_summary는 새 방식에서 추출
          kprc_summary: expect.objectContaining({
            expertOpinion: '새 방식 소견',
          }),
        }),
      );
    });
  });

  describe('Soul-E API 연동', () => {
    it('검사 결과가 없으면 Soul-E에서 조회한다', async () => {
      // Given
      const dto = createBaseWebhookDto();
      dto.testResults = {}; // 검사 결과 없음

      mockSoulEClient.getLatestAssessmentResult.mockResolvedValue({
        result_id: 'soul-e-result-123',
        session_id: 'session-123',
        child_id: dto.childId,
        child_name: '홍길동',
        assessment_type: 'KPRC_CO_SG_E',
        assessment_name: 'KPRC 인성평정척도',
        total_score: 85,
        max_score: 100,
        overall_level: 'normal',
        report_url: null,
        s3_report_url: 'reports/soul_e_kprc.pdf',
        summary: {
          key_findings: ['Soul-E 발견'],
          overall_assessment: 'Soul-E 종합 평가',
          recommendations: ['Soul-E 권장'],
          risk_areas: ['위험 영역'],
          strengths: ['강점 영역'],
          confidence_score: 0.9,
        },
        scored_at: '2025-01-15T12:00:00Z',
        created_at: '2025-01-15T12:00:00Z',
      });
      mockRepository.save.mockImplementation(async (request) => request);

      // When
      await useCase.execute(dto);

      // Then
      expect(mockSoulEClient.getLatestAssessmentResult).toHaveBeenCalledWith(dto.childId);
      expect(mockYeirinAIClient.requestIntegratedReport).toHaveBeenCalledWith(
        expect.objectContaining({
          attached_assessments: expect.arrayContaining([
            expect.objectContaining({
              assessmentType: 'KPRC_CO_SG_E',
              resultId: 'soul-e-result-123',
              reportS3Key: 'reports/soul_e_kprc.pdf',
            }),
          ]),
        }),
      );
    });

    it('Soul-E 조회 실패시에도 상담의뢰지 생성은 성공한다', async () => {
      // Given
      const dto = createBaseWebhookDto();
      dto.testResults = {};

      mockSoulEClient.getLatestAssessmentResult.mockRejectedValue(new Error('Soul-E 오류'));
      mockRepository.save.mockImplementation(async (request) => request);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result).toBeDefined();
      expect(result.status).toBe(CounselRequestStatus.PENDING);
      // 통합 보고서는 생성되지 않음
      expect(mockYeirinAIClient.requestIntegratedReport).not.toHaveBeenCalled();
    });
  });

  describe('사회서비스 이용 추천서 데이터 처리', () => {
    it('보호자 정보와 기관 정보를 yeirin-ai에 전달한다', async () => {
      // Given
      const dto = createBaseWebhookDto();
      dto.guardianInfo = {
        name: '홍부모',
        phoneNumber: '010-1234-5678',
        address: '서울시 강남구',
        relationToChild: '부',
      };
      dto.institutionInfo = {
        institutionName: '서울초등학교',
        phoneNumber: '02-123-4567',
        address: '서울시 강남구 학동로',
        writerPosition: '담임교사',
        writerName: '김선생',
        relationToChild: '담임교사',
      };
      dto.testResults = {
        attachedAssessments: [
          {
            assessmentType: 'KPRC_CO_SG_E',
            assessmentName: 'KPRC',
            resultId: 'result-123',
            reportS3Key: 'reports/kprc.pdf',
          },
        ],
      };
      mockRepository.save.mockImplementation(async (request) => request);

      // When
      await useCase.execute(dto);

      // Then
      expect(mockYeirinAIClient.requestIntegratedReport).toHaveBeenCalledWith(
        expect.objectContaining({
          guardian_info: expect.objectContaining({
            name: '홍부모',
            phoneNumber: '010-1234-5678',
          }),
          institution_info: expect.objectContaining({
            institutionName: '서울초등학교',
            writerName: '김선생',
          }),
        }),
      );
    });
  });

  describe('통합 보고서 생성 요청', () => {
    it('yeirin-ai 요청 실패해도 상담의뢰지 생성은 성공한다', async () => {
      // Given
      const dto = createBaseWebhookDto();
      dto.testResults = {
        attachedAssessments: [
          {
            assessmentType: 'KPRC_CO_SG_E',
            assessmentName: 'KPRC',
            resultId: 'result-123',
            reportS3Key: 'reports/kprc.pdf',
          },
        ],
      };

      mockYeirinAIClient.requestIntegratedReport.mockRejectedValue(new Error('yeirin-ai 오류'));
      mockRepository.save.mockImplementation(async (request) => request);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result).toBeDefined();
      expect(result.status).toBe(CounselRequestStatus.PENDING);
      expect(mockYeirinAIClient.requestIntegratedReport).toHaveBeenCalled();
    });

    it('검사 결과가 없으면 통합 보고서 생성을 건너뛴다', async () => {
      // Given
      const dto = createBaseWebhookDto();
      dto.testResults = {};

      mockSoulEClient.getLatestAssessmentResult.mockResolvedValue(null);
      mockRepository.save.mockImplementation(async (request) => request);

      // When
      await useCase.execute(dto);

      // Then
      expect(mockYeirinAIClient.requestIntegratedReport).not.toHaveBeenCalled();
    });

    it('기본 정보를 올바르게 전달한다', async () => {
      // Given
      const dto = createBaseWebhookDto();
      dto.basicInfo.childInfo.birthDate = { year: 2015, month: 3, day: 10 };
      dto.testResults = {
        attachedAssessments: [
          {
            assessmentType: 'KPRC_CO_SG_E',
            assessmentName: 'KPRC',
            resultId: 'result-123',
            reportS3Key: 'reports/kprc.pdf',
          },
        ],
      };
      mockRepository.save.mockImplementation(async (request) => request);

      // When
      await useCase.execute(dto);

      // Then
      expect(mockYeirinAIClient.requestIntegratedReport).toHaveBeenCalledWith(
        expect.objectContaining({
          child_id: dto.childId,
          child_name: '홍길동',
          cover_info: expect.objectContaining({
            centerName: '행복한 지역아동센터',
            counselorName: '김담당',
          }),
          basic_info: expect.objectContaining({
            childInfo: expect.objectContaining({
              name: '홍길동',
              gender: Gender.MALE,
              age: 10,
              grade: '초4',
              birthDate: { year: 2015, month: 3, day: 10 },
            }),
            careType: CareType.GENERAL,
          }),
          psychological_info: expect.objectContaining({
            medicalHistory: '없음',
            specialNotes: '특이사항 없음',
          }),
          request_motivation: expect.objectContaining({
            motivation: '또래 관계에서 어려움을 겪고 있어 상담 의뢰합니다.',
            goals: '또래 관계 개선 및 자존감 향상',
          }),
        }),
      );
    });
  });
});
