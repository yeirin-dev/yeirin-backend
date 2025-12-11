import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CounselRequest } from '@domain/counsel-request/model/counsel-request';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { S3Service } from '@infrastructure/storage/s3.service';
import { CounselRequestResponseDto } from '../dto/counsel-request-response.dto';

/**
 * 보호자 ID로 상담의뢰지 목록 조회 Use Case
 */
@Injectable()
export class GetCounselRequestsByGuardianUseCase {
  private readonly logger = new Logger(GetCounselRequestsByGuardianUseCase.name);

  constructor(
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(guardianId: string): Promise<CounselRequestResponseDto[]> {
    const counselRequests = await this.counselRequestRepository.findByGuardianId(guardianId);

    if (counselRequests.length === 0) {
      throw new NotFoundException(`보호자 ID ${guardianId}의 상담의뢰지를 찾을 수 없습니다`);
    }

    return Promise.all(counselRequests.map((counselRequest) => this.toResponseDto(counselRequest)));
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
