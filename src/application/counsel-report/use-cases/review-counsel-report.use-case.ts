import { Inject, Injectable } from '@nestjs/common';
import { Result, DomainError } from '@domain/common/result';
import { CounselReportRepository } from '@domain/counsel-report/repository/counsel-report.repository';
import { CounselReportResponseDto } from '../dto/counsel-report-response.dto';

/**
 * 면담결과지 확인 처리 Use Case
 *
 * @description
 * SUBMITTED → REVIEWED 상태 전환
 * 보호자가 면담결과지를 확인 (아직 피드백 작성 전)
 */
@Injectable()
export class ReviewCounselReportUseCase {
  constructor(
    @Inject('CounselReportRepository')
    private readonly counselReportRepository: CounselReportRepository,
  ) {}

  async execute(
    reportId: string,
    guardianId: string,
  ): Promise<Result<CounselReportResponseDto, DomainError>> {
    // 1. 면담결과지 조회
    const counselReport = await this.counselReportRepository.findById(reportId);

    if (!counselReport) {
      return Result.fail(new DomainError('면담결과지를 찾을 수 없습니다.', 'REPORT_NOT_FOUND'));
    }

    // 2. 권한 확인 (해당 아동의 보호자인지 확인 필요 - 실제로는 ChildRepository 조회 필요)
    // TODO: 보호자 권한 확인 로직 추가

    // 3. 확인 처리
    const reviewResult = counselReport.markAsReviewed();

    if (reviewResult.isFailure) {
      return Result.fail(reviewResult.getError());
    }

    // 4. 저장
    const reviewedReport = await this.counselReportRepository.save(counselReport);

    // 5. 응답 DTO 변환
    return Result.ok(this.toResponseDto(reviewedReport));
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
