import { CounselReport } from '@domain/counsel-report/model/counsel-report';
import { ReportStatus } from '@domain/counsel-report/model/value-objects/report-status';
import { CounselReportRepository } from '@domain/counsel-report/repository/counsel-report.repository';
import { GetCounselReportUseCase } from './get-counsel-report.use-case';

describe('GetCounselReportUseCase', () => {
  let useCase: GetCounselReportUseCase;
  let mockRepository: jest.Mocked<CounselReportRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCounselRequestIdAndSession: jest.fn(),
      findByCounselRequestId: jest.fn(),
      delete: jest.fn(),
    } as any;

    useCase = new GetCounselReportUseCase(mockRepository);
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

  describe('조회 성공', () => {
    it('면담결과지를 성공적으로 조회한다', async () => {
      // Given
      const reportId = 'report-123';
      const report = CounselReport.create(validReportProps).getValue();

      mockRepository.findById.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(mockRepository.findById).toHaveBeenCalledWith(reportId);
      expect(result.getValue().id).toBe(report.id);
      expect(result.getValue().counselorId).toBe(validReportProps.counselorId);
      expect(result.getValue().status).toBe(ReportStatus.DRAFT);
    });

    it('SUBMITTED 상태의 면담결과지를 조회한다', async () => {
      // Given
      const reportId = 'report-123';
      const report = CounselReport.create(validReportProps).getValue();
      report.submit();

      mockRepository.findById.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().status).toBe(ReportStatus.SUBMITTED);
      expect(result.getValue().submittedAt).toBeDefined();
    });

    it('REVIEWED 상태의 면담결과지를 조회한다', async () => {
      // Given
      const reportId = 'report-123';
      const report = CounselReport.create(validReportProps).getValue();
      report.submit();
      report.markAsReviewed();

      mockRepository.findById.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().status).toBe(ReportStatus.REVIEWED);
      expect(result.getValue().reviewedAt).toBeDefined();
    });

    it('APPROVED 상태의 면담결과지를 조회한다', async () => {
      // Given
      const reportId = 'report-123';
      const report = CounselReport.create(validReportProps).getValue();
      report.submit();
      report.markAsReviewed();
      report.approveWithFeedback('훌륭한 상담이었습니다');

      mockRepository.findById.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().status).toBe(ReportStatus.APPROVED);
      expect(result.getValue().guardianFeedback).toBe('훌륭한 상담이었습니다');
    });
  });

  describe('조회 실패', () => {
    it('존재하지 않는 면담결과지는 조회할 수 없다', async () => {
      // Given
      const reportId = 'non-existent-id';

      mockRepository.findById.mockResolvedValue(null);

      // When
      const result = await useCase.execute(reportId);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('REPORT_NOT_FOUND');
      expect(result.getError().message).toBe('면담결과지를 찾을 수 없습니다.');
    });
  });

  describe('응답 DTO 검증', () => {
    it('모든 필드가 올바르게 매핑된다', async () => {
      // Given
      const reportId = 'report-123';
      const report = CounselReport.create(validReportProps).getValue();

      mockRepository.findById.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId);

      // Then
      const dto = result.getValue();
      expect(dto.counselRequestId).toBe(validReportProps.counselRequestId);
      expect(dto.childId).toBe(validReportProps.childId);
      expect(dto.counselorId).toBe(validReportProps.counselorId);
      expect(dto.institutionId).toBe(validReportProps.institutionId);
      expect(dto.sessionNumber).toBe(validReportProps.sessionNumber);
      expect(dto.centerName).toBe(validReportProps.centerName);
      expect(dto.counselorSignature).toBe(validReportProps.counselorSignature);
      expect(dto.counselReason).toBe(validReportProps.counselReason);
      expect(dto.counselContent).toBe(validReportProps.counselContent);
      expect(dto.centerFeedback).toBe(validReportProps.centerFeedback);
      expect(dto.homeFeedback).toBe(validReportProps.homeFeedback);
    });
  });
});
