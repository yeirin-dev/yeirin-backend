import { Inject, Injectable, Logger } from '@nestjs/common';
import { CounselRequest } from '@domain/counsel-request/model/counsel-request';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { S3Service } from '@infrastructure/storage/s3.service';
import { CounselRequestResponseDto } from '../dto/counsel-request-response.dto';

@Injectable()
export class GetCounselRequestsByChildUseCase {
  private readonly logger = new Logger(GetCounselRequestsByChildUseCase.name);

  constructor(
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(childId: string): Promise<CounselRequestResponseDto[]> {
    const counselRequests = await this.counselRequestRepository.findByChildId(childId);
    return Promise.all(counselRequests.map((cr) => this.toResponseDto(cr)));
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
      guardianId: counselRequest.guardianId,
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
