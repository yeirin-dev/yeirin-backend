import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CounselRequest } from '@domain/counsel-request/model/counsel-request';
import { CounselRequestStatus } from '@domain/counsel-request/model/value-objects/counsel-request-enums';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { CounselRequestResponseDto } from '../dto/counsel-request-response.dto';

/**
 * 상태별 상담의뢰지 목록 조회 Use Case
 */
@Injectable()
export class GetCounselRequestsByStatusUseCase {
  constructor(
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
  ) {}

  async execute(status: CounselRequestStatus): Promise<CounselRequestResponseDto[]> {
    const counselRequests = await this.counselRequestRepository.findByStatus(status);

    if (counselRequests.length === 0) {
      throw new NotFoundException(`상태 ${status}의 상담의뢰지를 찾을 수 없습니다`);
    }

    return counselRequests.map((counselRequest) => this.toResponseDto(counselRequest));
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
