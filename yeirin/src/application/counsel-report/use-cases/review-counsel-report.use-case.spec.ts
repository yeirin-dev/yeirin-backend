import { CounselReport } from '@domain/counsel-report/model/counsel-report';
import { ReportStatus } from '@domain/counsel-report/model/value-objects/report-status';
import { CounselReportRepository } from '@domain/counsel-report/repository/counsel-report.repository';
import { ReviewCounselReportUseCase } from './review-counsel-report.use-case';

describe('ReviewCounselReportUseCase', () => {
  let useCase: ReviewCounselReportUseCase;
  let mockRepository: jest.Mocked<CounselReportRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCounselRequestIdAndSession: jest.fn(),
      findByCounselRequestId: jest.fn(),
      delete: jest.fn(),
    } as any;

    useCase = new ReviewCounselReportUseCase(mockRepository);
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

  describe('확인 처리 성공', () => {
    it('SUBMITTED 상태의 면담결과지를 성공적으로 확인 처리한다', async () => {
      // Given
      const reportId = 'report-123';
      const guardianId = 'guardian-123';
      const report = CounselReport.create(validReportProps).getValue();

      // SUBMITTED 상태로 만들기
      report.submit();

      mockRepository.findById.mockResolvedValue(report);
      mockRepository.save.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, guardianId);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(mockRepository.findById).toHaveBeenCalledWith(reportId);
      expect(mockRepository.save).toHaveBeenCalledWith(report);
      expect(result.getValue().status).toBe(ReportStatus.REVIEWED);
      expect(result.getValue().reviewedAt).toBeDefined();
    });
  });

  describe('확인 처리 실패 - 면담결과지를 찾을 수 없음', () => {
    it('존재하지 않는 면담결과지는 확인 처리할 수 없다', async () => {
      // Given
      const reportId = 'non-existent-id';
      const guardianId = 'guardian-123';

      mockRepository.findById.mockResolvedValue(null);

      // When
      const result = await useCase.execute(reportId, guardianId);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('REPORT_NOT_FOUND');
      expect(result.getError().message).toBe('면담결과지를 찾을 수 없습니다.');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('확인 처리 실패 - 확인 불가능한 상태', () => {
    it('DRAFT 상태의 면담결과지는 확인 처리할 수 없다', async () => {
      // Given
      const reportId = 'report-123';
      const guardianId = 'guardian-123';
      const report = CounselReport.create(validReportProps).getValue();

      // DRAFT 상태 유지

      mockRepository.findById.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, guardianId);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('이미 REVIEWED 상태인 면담결과지는 다시 확인 처리할 수 없다', async () => {
      // Given
      const reportId = 'report-123';
      const guardianId = 'guardian-123';
      const report = CounselReport.create(validReportProps).getValue();

      report.submit();
      report.markAsReviewed();

      mockRepository.findById.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, guardianId);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('APPROVED 상태의 면담결과지는 확인 처리할 수 없다', async () => {
      // Given
      const reportId = 'report-123';
      const guardianId = 'guardian-123';
      const report = CounselReport.create(validReportProps).getValue();

      report.submit();
      report.markAsReviewed();
      report.approveWithFeedback('훌륭합니다');

      mockRepository.findById.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, guardianId);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('INVALID_STATUS_TRANSITION');
    });
  });

  describe('확인 처리 후 상태 검증', () => {
    it('확인 처리 후 reviewedAt 타임스탬프가 설정된다', async () => {
      // Given
      const reportId = 'report-123';
      const guardianId = 'guardian-123';
      const report = CounselReport.create(validReportProps).getValue();

      report.submit();

      mockRepository.findById.mockResolvedValue(report);
      mockRepository.save.mockResolvedValue(report);

      const beforeReview = new Date();

      // When
      const result = await useCase.execute(reportId, guardianId);

      // Then
      const afterReview = new Date();
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().reviewedAt).toBeDefined();
      expect(result.getValue().reviewedAt!.getTime()).toBeGreaterThanOrEqual(
        beforeReview.getTime(),
      );
      expect(result.getValue().reviewedAt!.getTime()).toBeLessThanOrEqual(afterReview.getTime());
    });

    it('확인 처리 후에도 다른 필드는 유지된다', async () => {
      // Given
      const reportId = 'report-123';
      const guardianId = 'guardian-123';
      const report = CounselReport.create(validReportProps).getValue();

      report.submit();

      mockRepository.findById.mockResolvedValue(report);
      mockRepository.save.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, guardianId);

      // Then
      expect(result.getValue().counselReason).toBe(validReportProps.counselReason);
      expect(result.getValue().counselContent).toBe(validReportProps.counselContent);
      expect(result.getValue().submittedAt).toBeDefined();
    });
  });
});
