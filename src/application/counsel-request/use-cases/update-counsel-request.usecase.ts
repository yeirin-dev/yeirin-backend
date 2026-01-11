import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CounselRequest } from '@domain/counsel-request/model/counsel-request';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { CounselRequestResponseDto } from '../dto/counsel-request-response.dto';
import { UpdateCounselRequestDto } from '../dto/update-counsel-request.dto';

@Injectable()
export class UpdateCounselRequestUseCase {
  constructor(
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
  ) {}

  async execute(id: string, dto: UpdateCounselRequestDto): Promise<CounselRequestResponseDto> {
    const counselRequest = await this.counselRequestRepository.findById(id);

    if (!counselRequest) {
      throw new NotFoundException(`상담의뢰지를 찾을 수 없습니다 (ID: ${id})`);
    }

    // FormData 업데이트 (부분 업데이트)
    const updatedFormData = {
      ...counselRequest.formData,
      ...(dto.coverInfo && { coverInfo: dto.coverInfo }),
      ...(dto.basicInfo && { basicInfo: dto.basicInfo }),
      ...(dto.psychologicalInfo && { psychologicalInfo: dto.psychologicalInfo }),
      ...(dto.requestMotivation && { requestMotivation: dto.requestMotivation }),
      ...(dto.testResults && { testResults: dto.testResults }),
      ...(dto.consent && { consent: dto.consent }),
    };

    const result = counselRequest.updateFormData(updatedFormData);

    if (result.isFailure) {
      throw new BadRequestException(result.getError().message);
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
