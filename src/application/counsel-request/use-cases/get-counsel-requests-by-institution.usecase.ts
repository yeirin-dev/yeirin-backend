import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ChildRepository } from '@domain/child/repository/child.repository';
import { CounselRequest } from '@domain/counsel-request/model/counsel-request';
import { CounselRequestStatus } from '@domain/counsel-request/model/value-objects/counsel-request-enums';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { S3Service } from '@infrastructure/storage/s3.service';
import { CounselRequestResponseDto } from '../dto/counsel-request-response.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';

/**
 * 시설별 상담의뢰지 목록 조회 Use Case
 *
 * 해당 시설(양육시설/지역아동센터/교육복지사협회 학교)에 속한 아동들의 상담의뢰지만 조회합니다.
 */
@Injectable()
export class GetCounselRequestsByInstitutionUseCase {
  private readonly logger = new Logger(GetCounselRequestsByInstitutionUseCase.name);

  constructor(
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
    @Inject('ChildRepository')
    private readonly childRepository: ChildRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(
    institutionId: string,
    facilityType: 'CARE_FACILITY' | 'COMMUNITY_CENTER' | 'EDUCATION_WELFARE_SCHOOL',
    page: number = 1,
    limit: number = 10,
    status?: CounselRequestStatus,
  ): Promise<PaginatedResponseDto<CounselRequestResponseDto>> {
    // 1. 시설에 속한 아동 ID 목록 조회
    let children;
    switch (facilityType) {
      case 'CARE_FACILITY':
        children = await this.childRepository.findByCareFacilityId(institutionId);
        break;
      case 'COMMUNITY_CENTER':
        children = await this.childRepository.findByCommunityChildCenterId(institutionId);
        break;
      case 'EDUCATION_WELFARE_SCHOOL':
        children = await this.childRepository.findByEducationWelfareSchoolId(institutionId);
        break;
      default:
        throw new BadRequestException(`알 수 없는 시설 유형: ${facilityType}`);
    }

    const childIds = children.map((child) => child.id);

    if (childIds.length === 0) {
      return new PaginatedResponseDto([], 0, page, limit);
    }

    // 2. 아동들의 상담의뢰지 조회 (페이지네이션)
    const allCounselRequests: CounselRequest[] = [];
    for (const childId of childIds) {
      const requests = await this.counselRequestRepository.findByChildId(childId);
      allCounselRequests.push(...requests);
    }

    // 3. 상태 필터 적용
    let filteredRequests = allCounselRequests;
    if (status) {
      filteredRequests = allCounselRequests.filter((cr) => cr.status === status);
    }

    // 4. 최신순 정렬
    filteredRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // 5. 페이지네이션 적용
    const total = filteredRequests.length;
    const startIndex = (page - 1) * limit;
    const paginatedRequests = filteredRequests.slice(startIndex, startIndex + limit);

    // 6. DTO 변환
    const data = await Promise.all(paginatedRequests.map((cr) => this.toResponseDto(cr)));

    return new PaginatedResponseDto(data, total, page, limit);
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
