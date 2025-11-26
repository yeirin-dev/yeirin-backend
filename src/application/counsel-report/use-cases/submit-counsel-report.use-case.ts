import { Inject, Injectable } from '@nestjs/common';
import { Result, DomainError } from '@domain/common/result';
import { CounselReportRepository } from '@domain/counsel-report/repository/counsel-report.repository';
import { CounselReportResponseDto } from '../dto/counsel-report-response.dto';

/**
 * 면담결과지 제출 Use Case
 *
 * @description
 * DRAFT → SUBMITTED 상태 전환
 * 상담사가 작성 완료 후 제출하여 보호자에게 전달
 */
@Injectable()
export class SubmitCounselReportUseCase {
  constructor(
    @Inject('CounselReportRepository')
    private readonly counselReportRepository: CounselReportRepository,
  ) {}

  async execute(
    reportId: string,
    counselorId: string,
  ): Promise<Result<CounselReportResponseDto, DomainError>> {
    // 1. 면담결과지 조회
    const counselReport = await this.counselReportRepository.findById(reportId);

    if (!counselReport) {
      return Result.fail(new DomainError('면담결과지를 찾을 수 없습니다.', 'REPORT_NOT_FOUND'));
    }

    // 2. 권한 확인
    if (counselReport.counselorId !== counselorId) {
      return Result.fail(
        new DomainError('본인이 작성한 면담결과지만 제출할 수 있습니다.', 'UNAUTHORIZED'),
      );
    }

    // 3. 제출 (Domain Logic에서 유효성 검증)
    const submitResult = counselReport.submit();

    if (submitResult.isFailure) {
      return Result.fail(submitResult.getError());
    }

    // 4. 저장
    const submittedReport = await this.counselReportRepository.save(counselReport);

    // 5. 응답 DTO 변환
    return Result.ok(this.toResponseDto(submittedReport));
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
