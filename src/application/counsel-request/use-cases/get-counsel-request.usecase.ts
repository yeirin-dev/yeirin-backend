import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ChildRepository } from '@domain/child/repository/child.repository';
import { CounselRequest } from '@domain/counsel-request/model/counsel-request';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { S3Service } from '@infrastructure/storage/s3.service';
import { CounselRequestResponseDto } from '../dto/counsel-request-response.dto';

export interface CounselRequestAuthContext {
  institutionId: string;
  facilityType: 'CARE_FACILITY' | 'COMMUNITY_CENTER';
}

@Injectable()
export class GetCounselRequestUseCase {
  private readonly logger = new Logger(GetCounselRequestUseCase.name);

  constructor(
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
    @Inject('ChildRepository')
    private readonly childRepository: ChildRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(id: string, authContext: CounselRequestAuthContext): Promise<CounselRequestResponseDto> {
    const counselRequest = await this.counselRequestRepository.findById(id);

    if (!counselRequest) {
      throw new NotFoundException(`상담의뢰지를 찾을 수 없습니다 (ID: ${id})`);
    }

    // 권한 검증: 해당 상담의뢰지의 아동이 현재 시설에 속하는지 확인
    await this.validateAccess(counselRequest.childId, authContext);

    return this.toResponseDto(counselRequest);
  }

  /**
   * 상담의뢰지 접근 권한 검증
   * - 상담의뢰지의 아동이 현재 로그인한 시설에 속하는지 확인
   */
  private async validateAccess(childId: string, authContext: CounselRequestAuthContext): Promise<void> {
    const child = await this.childRepository.findById(childId);

    if (!child) {
      throw new NotFoundException(`아동을 찾을 수 없습니다 (ID: ${childId})`);
    }

    const hasAccess =
      (authContext.facilityType === 'CARE_FACILITY' && child.careFacilityId === authContext.institutionId) ||
      (authContext.facilityType === 'COMMUNITY_CENTER' && child.communityChildCenterId === authContext.institutionId);

    if (!hasAccess) {
      throw new ForbiddenException('이 상담의뢰지를 조회할 권한이 없습니다.');
    }
  }

  private async toResponseDto(counselRequest: CounselRequest): Promise<CounselRequestResponseDto> {
    // 통합 보고서 Presigned URL 생성 (S3 key가 있고, 상태가 completed일 때)
    let integratedReportUrl: string | undefined;
    if (
      counselRequest.integratedReportS3Key &&
      counselRequest.integratedReportStatus === 'completed'
    ) {
      try {
        integratedReportUrl = await this.s3Service.getPresignedUrl(
          counselRequest.integratedReportS3Key,
          3600, // 1시간 유효
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
