import { CounselReport } from '@domain/counsel-report/model/counsel-report';
import { ReportStatus } from '@domain/counsel-report/model/value-objects/report-status';
import { CounselReportRepository } from '@domain/counsel-report/repository/counsel-report.repository';
import { UpdateCounselReportDto } from '../dto/update-counsel-report.dto';
import { UpdateCounselReportUseCase } from './update-counsel-report.use-case';

describe('UpdateCounselReportUseCase', () => {
  let useCase: UpdateCounselReportUseCase;
  let mockRepository: jest.Mocked<CounselReportRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCounselRequestIdAndSession: jest.fn(),
      findByCounselRequestId: jest.fn(),
      delete: jest.fn(),
    } as any;

    useCase = new UpdateCounselReportUseCase(mockRepository);
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

  describe('수정 성공', () => {
    it('DRAFT 상태의 면담결과지를 성공적으로 수정한다', async () => {
      // Given
      const reportId = 'report-123';
      const counselorId = 'counselor-123';
      const report = CounselReport.create(validReportProps).getValue();

      const updateDto: UpdateCounselReportDto = {
        counselReason: '수정된 상담 사유',
        counselContent: '수정된 상담 내용',
      };

      mockRepository.findById.mockResolvedValue(report);
      mockRepository.save.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, updateDto, counselorId);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(mockRepository.findById).toHaveBeenCalledWith(reportId);
      expect(mockRepository.save).toHaveBeenCalledWith(report);
      expect(result.getValue().counselReason).toBe('수정된 상담 사유');
    });

    it('일부 필드만 수정할 수 있다', async () => {
      // Given
      const reportId = 'report-123';
      const counselorId = 'counselor-123';
      const report = CounselReport.create(validReportProps).getValue();

      const updateDto: UpdateCounselReportDto = {
        centerFeedback: '수정된 센터 피드백만',
      };

      mockRepository.findById.mockResolvedValue(report);
      mockRepository.save.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, updateDto, counselorId);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().centerFeedback).toBe('수정된 센터 피드백만');
      // 다른 필드는 유지
      expect(result.getValue().counselReason).toBe(validReportProps.counselReason);
    });
  });

  describe('수정 실패 - 면담결과지를 찾을 수 없음', () => {
    it('존재하지 않는 면담결과지는 수정할 수 없다', async () => {
      // Given
      const reportId = 'non-existent-id';
      const counselorId = 'counselor-123';
      const updateDto: UpdateCounselReportDto = {
        counselReason: '수정 시도',
      };

      mockRepository.findById.mockResolvedValue(null);

      // When
      const result = await useCase.execute(reportId, updateDto, counselorId);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('REPORT_NOT_FOUND');
      expect(result.getError().message).toBe('면담결과지를 찾을 수 없습니다.');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('수정 실패 - 권한 없음', () => {
    it('본인이 작성한 면담결과지가 아니면 수정할 수 없다', async () => {
      // Given
      const reportId = 'report-123';
      const wrongCounselorId = 'other-counselor-999';
      const report = CounselReport.create(validReportProps).getValue();

      const updateDto: UpdateCounselReportDto = {
        counselReason: '수정 시도',
      };

      mockRepository.findById.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, updateDto, wrongCounselorId);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('UNAUTHORIZED');
      expect(result.getError().message).toBe('본인이 작성한 면담결과지만 수정할 수 있습니다.');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('수정 실패 - 수정 불가능한 상태', () => {
    it('SUBMITTED 상태의 면담결과지는 수정할 수 없다', async () => {
      // Given
      const reportId = 'report-123';
      const counselorId = 'counselor-123';
      const report = CounselReport.create(validReportProps).getValue();

      // SUBMITTED 상태로 변경
      report.submit();

      const updateDto: UpdateCounselReportDto = {
        counselReason: '수정 시도',
      };

      mockRepository.findById.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, updateDto, counselorId);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('CANNOT_UPDATE_SUBMITTED_REPORT');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('REVIEWED 상태의 면담결과지는 수정할 수 없다', async () => {
      // Given
      const reportId = 'report-123';
      const counselorId = 'counselor-123';
      const report = CounselReport.create(validReportProps).getValue();

      // REVIEWED 상태로 변경
      report.submit();
      report.markAsReviewed();

      const updateDto: UpdateCounselReportDto = {
        counselReason: '수정 시도',
      };

      mockRepository.findById.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, updateDto, counselorId);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('CANNOT_UPDATE_SUBMITTED_REPORT');
    });

    it('APPROVED 상태의 면담결과지는 수정할 수 없다', async () => {
      // Given
      const reportId = 'report-123';
      const counselorId = 'counselor-123';
      const report = CounselReport.create(validReportProps).getValue();

      // APPROVED 상태로 변경
      report.submit();
      report.markAsReviewed();
      report.approveWithFeedback('좋은 상담이었습니다');

      const updateDto: UpdateCounselReportDto = {
        counselReason: '수정 시도',
      };

      mockRepository.findById.mockResolvedValue(report);

      // When
      const result = await useCase.execute(reportId, updateDto, counselorId);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().code).toBe('CANNOT_UPDATE_SUBMITTED_REPORT');
    });
  });
});
