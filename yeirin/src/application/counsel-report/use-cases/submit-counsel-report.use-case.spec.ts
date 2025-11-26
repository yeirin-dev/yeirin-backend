import { CounselReport } from '@domain/counsel-report/model/counsel-report';
import { ReportStatus } from '@domain/counsel-report/model/value-objects/report-status';
import { CounselReportRepository } from '@domain/counsel-report/repository/counsel-report.repository';
import { SubmitCounselReportUseCase } from './submit-counsel-report.use-case';

describe('SubmitCounselReportUseCase', () => {
  let useCase: SubmitCounselReportUseCase;
  let mockRepository: jest.Mocked<CounselReportRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCounselRequestIdAndSession: jest.fn(),
      findByCounselRequestId: jest.fn(),
      delete: jest.fn(),
    } as any;

    useCase = new SubmitCounselReportUseCase(mockRepository);
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

  describe('제출 성공', () => {
    it('DRAFT 상태의 면담결과지를 성공적으로 제출한다', async () => {
      // Given
      const reportId = 'report-123';
      const counselorId = 'counselor-123';
      const report = CounselReport.create(validReportProps).getValue();

      mockRepository.findById.mockResolvedValue(report);
      mockRepository.save.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, counselorId);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(mockRepository.findById).toHaveBeenCalledWith(reportId);
      expect(mockRepository.save).toHaveBeenCalledWith(report);
      expect(result.getValue().status).toBe(ReportStatus.SUBMITTED);
      expect(result.getValue().submittedAt).toBeDefined();
    });
  });

  describe('제출 실패 - 면담결과지를 찾을 수 없음', () => {
    it('존재하지 않는 면담결과지는 제출할 수 없다', async () => {
      // Given
      const reportId = 'non-existent-id';
      const counselorId = 'counselor-123';

      mockRepository.findById.mockResolvedValue(null);

      // When
      const result = await useCase.execute(reportId, counselorId);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('REPORT_NOT_FOUND');
      expect(result.getError().message).toBe('면담결과지를 찾을 수 없습니다.');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('제출 실패 - 권한 없음', () => {
    it('본인이 작성한 면담결과지가 아니면 제출할 수 없다', async () => {
      // Given
      const reportId = 'report-123';
      const wrongCounselorId = 'other-counselor-999';
      const report = CounselReport.create(validReportProps).getValue();

      mockRepository.findById.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, wrongCounselorId);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('UNAUTHORIZED');
      expect(result.getError().message).toBe('본인이 작성한 면담결과지만 제출할 수 있습니다.');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('제출 실패 - 제출 불가능한 상태', () => {
    it('이미 SUBMITTED 상태인 면담결과지는 다시 제출할 수 없다', async () => {
      // Given
      const reportId = 'report-123';
      const counselorId = 'counselor-123';
      const report = CounselReport.create(validReportProps).getValue();

      // 이미 제출된 상태
      report.submit();

      mockRepository.findById.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, counselorId);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('REVIEWED 상태의 면담결과지는 제출할 수 없다', async () => {
      // Given
      const reportId = 'report-123';
      const counselorId = 'counselor-123';
      const report = CounselReport.create(validReportProps).getValue();

      report.submit();
      report.markAsReviewed();

      mockRepository.findById.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, counselorId);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('APPROVED 상태의 면담결과지는 제출할 수 없다', async () => {
      // Given
      const reportId = 'report-123';
      const counselorId = 'counselor-123';
      const report = CounselReport.create(validReportProps).getValue();

      report.submit();
      report.markAsReviewed();
      report.approveWithFeedback('훌륭합니다');

      mockRepository.findById.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, counselorId);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('INVALID_STATUS_TRANSITION');
    });
  });

  describe('제출 후 상태 검증', () => {
    it('제출 후 submittedAt 타임스탬프가 설정된다', async () => {
      // Given
      const reportId = 'report-123';
      const counselorId = 'counselor-123';
      const report = CounselReport.create(validReportProps).getValue();

      mockRepository.findById.mockResolvedValue(report);
      mockRepository.save.mockResolvedValue(report);

      const beforeSubmit = new Date();

      // When
      const result = await useCase.execute(reportId, counselorId);

      // Then
      const afterSubmit = new Date();
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().submittedAt).toBeDefined();
      expect(result.getValue().submittedAt!.getTime()).toBeGreaterThanOrEqual(
        beforeSubmit.getTime(),
      );
      expect(result.getValue().submittedAt!.getTime()).toBeLessThanOrEqual(afterSubmit.getTime());
    });
  });
});
