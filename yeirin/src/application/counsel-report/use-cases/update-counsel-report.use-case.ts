import { Inject, Injectable } from '@nestjs/common';
import { Result, DomainError } from '@domain/common/result';
import { CounselReportRepository } from '@domain/counsel-report/repository/counsel-report.repository';
import { CounselReportResponseDto } from '../dto/counsel-report-response.dto';
import { UpdateCounselReportDto } from '../dto/update-counsel-report.dto';

/**
 * 면담결과지 수정 Use Case
 *
 * @description
 * DRAFT 상태의 면담결과지만 수정 가능
 */
@Injectable()
export class UpdateCounselReportUseCase {
  constructor(
    @Inject('CounselReportRepository')
    private readonly counselReportRepository: CounselReportRepository,
  ) {}

  async execute(
    reportId: string,
    dto: UpdateCounselReportDto,
    counselorId: string,
  ): Promise<Result<CounselReportResponseDto, DomainError>> {
    // 1. 면담결과지 조회
    const counselReport = await this.counselReportRepository.findById(reportId);

    if (!counselReport) {
      return Result.fail(new DomainError('면담결과지를 찾을 수 없습니다.', 'REPORT_NOT_FOUND'));
    }

    // 2. 권한 확인 (본인이 작성한 결과지인지)
    if (counselReport.counselorId !== counselorId) {
      return Result.fail(
        new DomainError('본인이 작성한 면담결과지만 수정할 수 있습니다.', 'UNAUTHORIZED'),
      );
    }

    // 3. 수정
    const updateResult = counselReport.update(dto);

    if (updateResult.isFailure) {
      return Result.fail(updateResult.getError());
    }

    // 4. 저장
    const updatedReport = await this.counselReportRepository.save(counselReport);

    // 5. 응답 DTO 변환
    return Result.ok(this.toResponseDto(updatedReport));
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
