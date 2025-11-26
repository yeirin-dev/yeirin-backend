import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CounselRequest } from '@domain/counsel-request/model/counsel-request';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { CounselRequestResponseDto } from '../dto/counsel-request-response.dto';

/**
 * 보호자 ID로 상담의뢰지 목록 조회 Use Case
 */
@Injectable()
export class GetCounselRequestsByGuardianUseCase {
  constructor(
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
  ) {}

  async execute(guardianId: string): Promise<CounselRequestResponseDto[]> {
    const counselRequests = await this.counselRequestRepository.findByGuardianId(guardianId);

    if (counselRequests.length === 0) {
      throw new NotFoundException(`보호자 ID ${guardianId}의 상담의뢰지를 찾을 수 없습니다`);
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
