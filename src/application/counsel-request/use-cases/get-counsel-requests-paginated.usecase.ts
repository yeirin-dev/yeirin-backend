import { Inject, Injectable, Logger } from '@nestjs/common';
import { CounselRequest } from '@domain/counsel-request/model/counsel-request';
import { CounselRequestStatus } from '@domain/counsel-request/model/value-objects/counsel-request-enums';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { S3Service } from '@infrastructure/storage/s3.service';
import { CounselRequestResponseDto } from '../dto/counsel-request-response.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';

/**
 * 상담의뢰지 페이지네이션 조회 Use Case (필터 지원)
 */
@Injectable()
export class GetCounselRequestsPaginatedUseCase {
  private readonly logger = new Logger(GetCounselRequestsPaginatedUseCase.name);

  constructor(
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(
    page: number,
    limit: number,
    status?: CounselRequestStatus,
  ): Promise<PaginatedResponseDto<CounselRequestResponseDto>> {
    const result = await this.counselRequestRepository.findAll(page, limit, status);

    const data = await Promise.all(
      result.data.map((counselRequest) => this.toResponseDto(counselRequest)),
    );

    return new PaginatedResponseDto(data, result.total, result.page, result.limit);
  }

  private async toResponseDto(counselRequest: CounselRequest): Promise<CounselRequestResponseDto> {
    let integratedReportUrl: string | undefined;
    if (
      counselRequest.integratedReportS3Key &&
      counselRequest.integratedReportStatus === 'completed'
    ) {
      try {
        integratedReportUrl = await this.s3Service.getPresignedUrl(
          counselRequest.integratedReportS3Key,
          3600,
        );
      } catch (error) {
        this.logger.warn(`통합 보고서 Presigned URL 생성 실패: ${error.message}`, {
          counselRequestId: counselRequest.id,
          s3Key: counselRequest.integratedReportS3Key,
        });
      }
    }

    return {
      id: counselRequest.id,
      childId: counselRequest.childId,
      status: counselRequest.status,
      formData: counselRequest.formData,
      centerName: counselRequest.centerName,
      careType: counselRequest.careType,
      requestDate: counselRequest.requestDate,
      matchedInstitutionId: counselRequest.matchedInstitutionId,
      matchedCounselorId: counselRequest.matchedCounselorId,
      integratedReportStatus: counselRequest.integratedReportStatus,
      integratedReportUrl,
      createdAt: counselRequest.createdAt,
      updatedAt: counselRequest.updatedAt,
    };
  }
}
