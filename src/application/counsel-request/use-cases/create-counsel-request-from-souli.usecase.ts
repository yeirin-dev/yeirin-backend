import { Inject, Injectable } from '@nestjs/common';
import { CounselRequest } from '@domain/counsel-request/model/counsel-request';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { SouliWebhookDto } from '../dto/souli-webhook.dto';
import { CounselRequestResponseDto } from '../dto/counsel-request-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CreateCounselRequestFromSouliUseCase {
  constructor(
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
  ) {}

  async execute(dto: SouliWebhookDto): Promise<CounselRequestResponseDto> {
    // FormData 구성
    const formData = {
      coverInfo: dto.coverInfo,
      basicInfo: dto.basicInfo,
      psychologicalInfo: dto.psychologicalInfo,
      requestMotivation: dto.requestMotivation,
      testResults: dto.testResults,
      consent: dto.consent,
    };

    // CounselRequest 도메인 생성
    const result = CounselRequest.create({
      id: uuidv4(),
      childId: dto.childId,
      guardianId: dto.guardianId,
      formData,
    });

    if (result.isFailure) {
      throw new Error(result.getError().message);
    }

    const counselRequest = result.getValue();

    // 저장
    const saved = await this.counselRequestRepository.save(counselRequest);

    // TODO: 소울이 세션 ID 로깅 또는 별도 테이블에 저장
    console.log(`✅ 소울이 연동 성공 - Session ID: ${dto.souliSessionId}`);

    // Response DTO 변환
    return this.toResponseDto(saved);
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
