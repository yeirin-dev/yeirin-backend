import { Inject, Injectable } from '@nestjs/common';
import { CounselRequest } from '@domain/counsel-request/model/counsel-request';
import { CounselRequestStatus } from '@domain/counsel-request/model/value-objects/counsel-request-enums';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { CounselRequestResponseDto } from '../dto/counsel-request-response.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';

/**
 * 상담의뢰지 페이지네이션 조회 Use Case (필터 지원)
 */
@Injectable()
export class GetCounselRequestsPaginatedUseCase {
  constructor(
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
  ) {}

  async execute(
    page: number,
    limit: number,
    status?: CounselRequestStatus,
  ): Promise<PaginatedResponseDto<CounselRequestResponseDto>> {
    const result = await this.counselRequestRepository.findAll(page, limit, status);

    const data = result.data.map((counselRequest) => this.toResponseDto(counselRequest));

    return new PaginatedResponseDto(data, result.total, result.page, result.limit);
  }

  private toResponseDto(counselRequest: CounselRequest): CounselRequestResponseDto {
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
      createdAt: counselRequest.createdAt,
      updatedAt: counselRequest.updatedAt,
    };
  }
}
