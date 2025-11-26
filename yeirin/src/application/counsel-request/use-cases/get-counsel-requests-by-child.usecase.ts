import { Inject, Injectable } from '@nestjs/common';
import { CounselRequest } from '@domain/counsel-request/model/counsel-request';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { CounselRequestResponseDto } from '../dto/counsel-request-response.dto';

@Injectable()
export class GetCounselRequestsByChildUseCase {
  constructor(
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
  ) {}

  async execute(childId: string): Promise<CounselRequestResponseDto[]> {
    const counselRequests = await this.counselRequestRepository.findByChildId(childId);
    return counselRequests.map((cr) => this.toResponseDto(cr));
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
