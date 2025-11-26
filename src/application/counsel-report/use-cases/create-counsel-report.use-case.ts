import { Inject, Injectable } from '@nestjs/common';
import { Result, DomainError } from '@domain/common/result';
import { CounselReport } from '@domain/counsel-report/model/counsel-report';
import { CounselReportRepository } from '@domain/counsel-report/repository/counsel-report.repository';
import { CounselReportResponseDto } from '../dto/counsel-report-response.dto';
import { CreateCounselReportDto } from '../dto/create-counsel-report.dto';

/**
 * 면담결과지 생성 Use Case
 *
 * @description
 * 상담사가 상담 후 면담결과지를 작성 (DRAFT 상태로 생성)
 */
@Injectable()
export class CreateCounselReportUseCase {
  constructor(
    @Inject('CounselReportRepository')
    private readonly counselReportRepository: CounselReportRepository,
  ) {}

  async execute(
    dto: CreateCounselReportDto,
    counselorId: string,
    institutionId: string,
  ): Promise<Result<CounselReportResponseDto, DomainError>> {
    // 1. 같은 의뢰지의 같은 회차가 이미 존재하는지 확인
    const existingReport = await this.counselReportRepository.findByCounselRequestIdAndSession(
      dto.counselRequestId,
      dto.sessionNumber,
    );

    if (existingReport) {
      return Result.fail(
        new DomainError(
          '해당 상담의뢰지의 해당 회차 면담결과지가 이미 존재합니다.',
          'DUPLICATE_SESSION_NUMBER',
        ),
      );
    }

    // 2. CounselReport Aggregate 생성
    const counselReportResult = CounselReport.create({
      counselRequestId: dto.counselRequestId,
      childId: dto.childId,
      counselorId,
      institutionId,
      sessionNumber: dto.sessionNumber,
      reportDate: dto.reportDate,
      centerName: dto.centerName,
      counselorSignature: dto.counselorSignature || null,
      counselReason: dto.counselReason,
      counselContent: dto.counselContent,
      centerFeedback: dto.centerFeedback || null,
      homeFeedback: dto.homeFeedback || null,
      attachmentUrls: dto.attachmentUrls || [],
    });

    if (counselReportResult.isFailure) {
      return Result.fail(counselReportResult.getError());
    }

    const counselReport = counselReportResult.getValue();

    // 3. 저장
    const savedReport = await this.counselReportRepository.save(counselReport);

    // 4. 응답 DTO 변환
    return Result.ok(this.toResponseDto(savedReport));
  }

  private toResponseDto(counselReport: CounselReport): CounselReportResponseDto {
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
