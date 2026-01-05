import { Inject, Injectable } from '@nestjs/common';
import { Result, DomainError } from '@domain/common/result';
import { CounselReportRepository } from '@domain/counsel-report/repository/counsel-report.repository';
import { CounselReportResponseDto } from '../dto/counsel-report-response.dto';

/**
 * 면담결과지 단건 조회 Use Case
 */
@Injectable()
export class GetCounselReportUseCase {
  constructor(
    @Inject('CounselReportRepository')
    private readonly counselReportRepository: CounselReportRepository,
  ) {}

  async execute(reportId: string): Promise<Result<CounselReportResponseDto, DomainError>> {
    const counselReport = await this.counselReportRepository.findById(reportId);

    if (!counselReport) {
      return Result.fail(new DomainError('면담결과지를 찾을 수 없습니다.', 'REPORT_NOT_FOUND'));
    }

    return Result.ok(this.toResponseDto(counselReport));
  }

  private toResponseDto(counselReport: any): CounselReportResponseDto {
    return {
      id: counselReport.id,
      counselRequestId: counselReport.counselRequestId,
      childId: counselReport.childId,
      counselorId: counselReport.counselorId,
      institutionId: counselReport.institutionId,
      sessionNumber: counselReport.sessionNumber,
      reportDate: counselReport.reportDate,
      centerName: counselReport.centerName,
      counselorSignature: counselReport.counselorSignature,
      counselReason: counselReport.counselReason,
      counselContent: counselReport.counselContent,
      centerFeedback: counselReport.centerFeedback,
      homeFeedback: counselReport.homeFeedback,
      attachmentUrls: counselReport.attachmentUrls,
      status: counselReport.status,
      submittedAt: counselReport.submittedAt,
      reviewedAt: counselReport.reviewedAt,
      guardianFeedback: counselReport.guardianFeedback,
      createdAt: counselReport.createdAt,
      updatedAt: counselReport.updatedAt,
    };
  }
}
