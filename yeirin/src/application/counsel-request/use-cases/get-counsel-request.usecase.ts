import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { CounselRequestResponseDto } from '../dto/counsel-request-response.dto';
import { CounselRequest } from '@domain/counsel-request/model/counsel-request';

@Injectable()
export class GetCounselRequestUseCase {
  constructor(
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
  ) {}

  async execute(id: string): Promise<CounselRequestResponseDto> {
    const counselRequest = await this.counselRequestRepository.findById(id);

    if (!counselRequest) {
      throw new NotFoundException(`상담의뢰지를 찾을 수 없습니다 (ID: ${id})`);
    }

    return this.toResponseDto(counselRequest);
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
