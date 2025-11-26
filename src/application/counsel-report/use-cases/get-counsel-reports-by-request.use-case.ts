import { Inject, Injectable } from '@nestjs/common';
import { CounselReportRepository } from '@domain/counsel-report/repository/counsel-report.repository';
import { CounselReportResponseDto } from '../dto/counsel-report-response.dto';

/**
 * 상담의뢰지별 면담결과지 목록 조회 Use Case
 *
 * @description
 * 특정 상담의뢰지에 대한 모든 회차의 면담결과지 조회
 */
@Injectable()
export class GetCounselReportsByRequestUseCase {
  constructor(
    @Inject('CounselReportRepository')
    private readonly counselReportRepository: CounselReportRepository,
  ) {}

  async execute(counselRequestId: string): Promise<CounselReportResponseDto[]> {
    const reports = await this.counselReportRepository.findByCounselRequestId(counselRequestId);

    return reports.map((report) => this.toResponseDto(report));
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
