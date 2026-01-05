import { CounselReport } from '@domain/counsel-report/model/counsel-report';
import { ReportStatus } from '@domain/counsel-report/model/value-objects/report-status';
import { CounselReportRepository } from '@domain/counsel-report/repository/counsel-report.repository';
import { GetCounselReportsByRequestUseCase } from './get-counsel-reports-by-request.use-case';

describe('GetCounselReportsByRequestUseCase', () => {
  let useCase: GetCounselReportsByRequestUseCase;
  let mockRepository: jest.Mocked<CounselReportRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCounselRequestIdAndSession: jest.fn(),
      findByCounselRequestId: jest.fn(),
      delete: jest.fn(),
    } as any;

    useCase = new GetCounselReportsByRequestUseCase(mockRepository);
  });

  const createReport = (sessionNumber: number) => {
    return CounselReport.create({
      counselRequestId: 'request-123',
      childId: 'child-123',
      counselorId: 'counselor-123',
      institutionId: 'institution-123',
      sessionNumber,
      reportDate: new Date(`2024-01-${sessionNumber + 14}`),
      centerName: '행복 심리상담센터',
      counselorSignature: '홍길동',
      counselReason: `${sessionNumber}회차 상담`,
      counselContent: `${sessionNumber}회차 상담 내용`,
      centerFeedback: '적극적 참여',
      homeFeedback: '부모 협조 필요',
      attachmentUrls: [],
    }).getValue();
  };

  describe('조회 성공', () => {
    it('특정 상담의뢰지의 모든 면담결과지를 조회한다', async () => {
      // Given
      const counselRequestId = 'request-123';
      const reports = [createReport(1), createReport(2), createReport(3)];

      mockRepository.findByCounselRequestId.mockResolvedValue(reports);

      // When
      const result = await useCase.execute(counselRequestId);

      // Then
      expect(mockRepository.findByCounselRequestId).toHaveBeenCalledWith(counselRequestId);
      expect(result).toHaveLength(3);
      expect(result[0].sessionNumber).toBe(1);
      expect(result[1].sessionNumber).toBe(2);
      expect(result[2].sessionNumber).toBe(3);
    });

    it('단일 면담결과지를 조회한다', async () => {
      // Given
      const counselRequestId = 'request-123';
      const reports = [createReport(1)];

      mockRepository.findByCounselRequestId.mockResolvedValue(reports);

      // When
      const result = await useCase.execute(counselRequestId);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].sessionNumber).toBe(1);
      expect(result[0].counselRequestId).toBe(counselRequestId);
    });

    it('면담결과지가 없는 경우 빈 배열을 반환한다', async () => {
      // Given
      const counselRequestId = 'request-without-reports';

      mockRepository.findByCounselRequestId.mockResolvedValue([]);

      // When
      const result = await useCase.execute(counselRequestId);

      // Then
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('다양한 상태의 면담결과지를 조회한다', async () => {
      // Given
      const counselRequestId = 'request-123';

      const report1 = createReport(1);
      report1.submit();
      report1.markAsReviewed();
      report1.approveWithFeedback('1회차 피드백');

      const report2 = createReport(2);
      report2.submit();
      report2.markAsReviewed();

      const report3 = createReport(3);
      report3.submit();

      const report4 = createReport(4);
      // DRAFT 상태 유지

      const reports = [report1, report2, report3, report4];

      mockRepository.findByCounselRequestId.mockResolvedValue(reports);

      // When
      const result = await useCase.execute(counselRequestId);

      // Then
      expect(result).toHaveLength(4);
      expect(result[0].status).toBe(ReportStatus.APPROVED);
      expect(result[1].status).toBe(ReportStatus.REVIEWED);
      expect(result[2].status).toBe(ReportStatus.SUBMITTED);
      expect(result[3].status).toBe(ReportStatus.DRAFT);
    });
  });

  describe('응답 DTO 검증', () => {
    it('모든 면담결과지가 올바르게 DTO로 변환된다', async () => {
      // Given
      const counselRequestId = 'request-123';
      const reports = [createReport(1), createReport(2)];

      mockRepository.findByCounselRequestId.mockResolvedValue(reports);

      // When
      const result = await useCase.execute(counselRequestId);

      // Then
      result.forEach((dto, index) => {
        expect(dto.id).toBeDefined();
        expect(dto.counselRequestId).toBe(counselRequestId);
        expect(dto.childId).toBe('child-123');
        expect(dto.counselorId).toBe('counselor-123');
        expect(dto.institutionId).toBe('institution-123');
        expect(dto.sessionNumber).toBe(index + 1);
        expect(dto.centerName).toBe('행복 심리상담센터');
        expect(dto.counselorSignature).toBe('홍길동');
        expect(dto.createdAt).toBeDefined();
        expect(dto.updatedAt).toBeDefined();
      });
    });

    it('피드백 정보가 올바르게 매핑된다', async () => {
      // Given
      const counselRequestId = 'request-123';
      const report = createReport(1);
      report.submit();
      report.markAsReviewed();
      report.approveWithFeedback('매우 좋습니다');

      mockRepository.findByCounselRequestId.mockResolvedValue([report]);

      // When
      const result = await useCase.execute(counselRequestId);

      // Then
      expect(result[0].guardianFeedback).toBe('매우 좋습니다');
      expect(result[0].submittedAt).toBeDefined();
      expect(result[0].reviewedAt).toBeDefined();
    });
  });

  describe('회차 정보 검증', () => {
    it('여러 회차의 면담결과지를 순서대로 조회한다', async () => {
      // Given
      const counselRequestId = 'request-123';
      const reports = Array.from({ length: 10 }, (_, i) => createReport(i + 1));

      mockRepository.findByCounselRequestId.mockResolvedValue(reports);

      // When
      const result = await useCase.execute(counselRequestId);

      // Then
      expect(result).toHaveLength(10);
      result.forEach((dto, index) => {
        expect(dto.sessionNumber).toBe(index + 1);
        expect(dto.counselReason).toBe(`${index + 1}회차 상담`);
      });
    });
  });
});
