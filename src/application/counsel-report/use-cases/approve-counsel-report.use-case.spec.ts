import { CounselReport } from '@domain/counsel-report/model/counsel-report';
import { ReportStatus } from '@domain/counsel-report/model/value-objects/report-status';
import { CounselReportRepository } from '@domain/counsel-report/repository/counsel-report.repository';
import { ApproveCounselReportDto } from '../dto/approve-counsel-report.dto';
import { ApproveCounselReportUseCase } from './approve-counsel-report.use-case';

describe('ApproveCounselReportUseCase', () => {
  let useCase: ApproveCounselReportUseCase;
  let mockRepository: jest.Mocked<CounselReportRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCounselRequestIdAndSession: jest.fn(),
      findByCounselRequestId: jest.fn(),
      delete: jest.fn(),
    } as any;

    useCase = new ApproveCounselReportUseCase(mockRepository);
  });

  const validReportProps = {
    counselRequestId: 'request-123',
    childId: 'child-123',
    counselorId: 'counselor-123',
    institutionId: 'institution-123',
    sessionNumber: 1,
    reportDate: new Date('2024-01-15'),
    centerName: '행복 심리상담센터',
    counselorSignature: '홍길동',
    counselReason: '초기 상담',
    counselContent: '아동과의 첫 만남',
    centerFeedback: '적극적 참여',
    homeFeedback: '부모 협조 필요',
    attachmentUrls: [],
  };

  describe('승인 성공', () => {
    it('REVIEWED 상태의 면담결과지를 피드백과 함께 승인한다', async () => {
      // Given
      const reportId = 'report-123';
      const guardianId = 'guardian-123';
      const report = CounselReport.create(validReportProps).getValue();

      // REVIEWED 상태로 만들기
      report.submit();
      report.markAsReviewed();

      const dto: ApproveCounselReportDto = {
        guardianFeedback: '매우 만족스러운 상담이었습니다. 감사합니다.',
      };

      mockRepository.findById.mockResolvedValue(report);
      mockRepository.save.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, dto, guardianId);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(mockRepository.findById).toHaveBeenCalledWith(reportId);
      expect(mockRepository.save).toHaveBeenCalledWith(report);
      expect(result.getValue().status).toBe(ReportStatus.APPROVED);
      expect(result.getValue().guardianFeedback).toBe(
        '매우 만족스러운 상담이었습니다. 감사합니다.',
      );
    });

    it('간단한 피드백으로 승인할 수 있다', async () => {
      // Given
      const reportId = 'report-123';
      const guardianId = 'guardian-123';
      const report = CounselReport.create(validReportProps).getValue();

      report.submit();
      report.markAsReviewed();

      const dto: ApproveCounselReportDto = {
        guardianFeedback: '좋습니다',
      };

      mockRepository.findById.mockResolvedValue(report);
      mockRepository.save.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, dto, guardianId);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().guardianFeedback).toBe('좋습니다');
    });

    it('긴 피드백으로 승인할 수 있다', async () => {
      // Given
      const reportId = 'report-123';
      const guardianId = 'guardian-123';
      const report = CounselReport.create(validReportProps).getValue();

      report.submit();
      report.markAsReviewed();

      const longFeedback = '상담사님께서 우리 아이를 잘 이해해주시고 '.repeat(10);

      const dto: ApproveCounselReportDto = {
        guardianFeedback: longFeedback,
      };

      mockRepository.findById.mockResolvedValue(report);
      mockRepository.save.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, dto, guardianId);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().guardianFeedback).toBe(longFeedback);
    });
  });

  describe('승인 실패 - 면담결과지를 찾을 수 없음', () => {
    it('존재하지 않는 면담결과지는 승인할 수 없다', async () => {
      // Given
      const reportId = 'non-existent-id';
      const guardianId = 'guardian-123';
      const dto: ApproveCounselReportDto = {
        guardianFeedback: '좋습니다',
      };

      mockRepository.findById.mockResolvedValue(null);

      // When
      const result = await useCase.execute(reportId, dto, guardianId);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('REPORT_NOT_FOUND');
      expect(result.getError().message).toBe('면담결과지를 찾을 수 없습니다.');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('승인 실패 - 승인 불가능한 상태', () => {
    it('DRAFT 상태의 면담결과지는 승인할 수 없다', async () => {
      // Given
      const reportId = 'report-123';
      const guardianId = 'guardian-123';
      const report = CounselReport.create(validReportProps).getValue();

      const dto: ApproveCounselReportDto = {
        guardianFeedback: '좋습니다',
      };

      mockRepository.findById.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, dto, guardianId);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('SUBMITTED 상태의 면담결과지는 승인할 수 없다', async () => {
      // Given
      const reportId = 'report-123';
      const guardianId = 'guardian-123';
      const report = CounselReport.create(validReportProps).getValue();

      report.submit();

      const dto: ApproveCounselReportDto = {
        guardianFeedback: '좋습니다',
      };

      mockRepository.findById.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, dto, guardianId);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('이미 APPROVED 상태인 면담결과지는 다시 승인할 수 없다', async () => {
      // Given
      const reportId = 'report-123';
      const guardianId = 'guardian-123';
      const report = CounselReport.create(validReportProps).getValue();

      report.submit();
      report.markAsReviewed();
      report.approveWithFeedback('이전 피드백');

      const dto: ApproveCounselReportDto = {
        guardianFeedback: '새로운 피드백',
      };

      mockRepository.findById.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, dto, guardianId);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('INVALID_STATUS_TRANSITION');
    });
  });

  describe('승인 실패 - 유효성 검증', () => {
    it('빈 피드백으로는 승인할 수 없다', async () => {
      // Given
      const reportId = 'report-123';
      const guardianId = 'guardian-123';
      const report = CounselReport.create(validReportProps).getValue();

      report.submit();
      report.markAsReviewed();

      const dto: ApproveCounselReportDto = {
        guardianFeedback: '',
      };

      mockRepository.findById.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, dto, guardianId);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('INVALID_FEEDBACK');
    });

    it('공백만 있는 피드백으로는 승인할 수 없다', async () => {
      // Given
      const reportId = 'report-123';
      const guardianId = 'guardian-123';
      const report = CounselReport.create(validReportProps).getValue();

      report.submit();
      report.markAsReviewed();

      const dto: ApproveCounselReportDto = {
        guardianFeedback: '   ',
      };

      mockRepository.findById.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, dto, guardianId);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('INVALID_FEEDBACK');
    });
  });

  describe('승인 후 상태 검증', () => {
    it('승인 후에도 다른 필드는 유지된다', async () => {
      // Given
      const reportId = 'report-123';
      const guardianId = 'guardian-123';
      const report = CounselReport.create(validReportProps).getValue();

      report.submit();
      report.markAsReviewed();

      const dto: ApproveCounselReportDto = {
        guardianFeedback: '좋습니다',
      };

      mockRepository.findById.mockResolvedValue(report);
      mockRepository.save.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, dto, guardianId);

      // Then
      expect(result.getValue().counselReason).toBe(validReportProps.counselReason);
      expect(result.getValue().counselContent).toBe(validReportProps.counselContent);
      expect(result.getValue().submittedAt).toBeDefined();
      expect(result.getValue().reviewedAt).toBeDefined();
    });
  });
});
