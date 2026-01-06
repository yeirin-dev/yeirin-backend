import { Inject, Injectable } from '@nestjs/common';
import { Result, DomainError } from '@domain/common/result';
import { CounselReportRepository } from '@domain/counsel-report/repository/counsel-report.repository';
import { ApproveCounselReportDto } from '../dto/approve-counsel-report.dto';
import { CounselReportResponseDto } from '../dto/counsel-report-response.dto';

/**
 * 면담결과지 승인 Use Case
 *
 * @description
 * REVIEWED → APPROVED 상태 전환
 * 보호자가 피드백을 작성하여 승인
 */
@Injectable()
export class ApproveCounselReportUseCase {
  constructor(
    @Inject('CounselReportRepository')
    private readonly counselReportRepository: CounselReportRepository,
  ) {}

  async execute(
    reportId: string,
    dto: ApproveCounselReportDto,
    userId: string,
  ): Promise<Result<CounselReportResponseDto, DomainError>> {
    // 1. 면담결과지 조회
    const counselReport = await this.counselReportRepository.findById(reportId);

    if (!counselReport) {
      return Result.fail(new DomainError('면담결과지를 찾을 수 없습니다.', 'REPORT_NOT_FOUND'));
    }

    // 2. 권한 확인 (해당 아동의 보호자인지 확인 필요)
    // TODO: 보호자 권한 확인 로직 추가

    // 3. 피드백과 함께 승인
    const approveResult = counselReport.approveWithFeedback(dto.guardianFeedback);

    if (approveResult.isFailure) {
      return Result.fail(approveResult.getError());
    }

    // 4. 저장
    const approvedReport = await this.counselReportRepository.save(counselReport);

    // 5. 응답 DTO 변환
    return Result.ok(this.toResponseDto(approvedReport));
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
