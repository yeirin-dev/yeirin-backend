import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CounselRequest } from '@domain/counsel-request/model/counsel-request';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { CounselRequestResponseDto } from '../dto/counsel-request-response.dto';

export interface MatchCounselRequestDto {
  institutionId: string;
  counselorId: string;
}

@Injectable()
export class MatchCounselRequestUseCase {
  constructor(
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
  ) {}

  async execute(id: string, dto: MatchCounselRequestDto): Promise<CounselRequestResponseDto> {
    const counselRequest = await this.counselRequestRepository.findById(id);

    if (!counselRequest) {
      throw new NotFoundException(`상담의뢰지를 찾을 수 없습니다 (ID: ${id})`);
    }

    const result = counselRequest.matchWith(dto.institutionId, dto.counselorId);

    if (result.isFailure) {
      throw new Error(result.getError().message);
    }

    const saved = await this.counselRequestRepository.save(counselRequest);
    return this.toResponseDto(saved);
  }

  private toResponseDto(counselRequest: CounselRequest): CounselRequestResponseDto {
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
      createdAt: counselRequest.createdAt,
      updatedAt: counselRequest.updatedAt,
    };
  }
}
