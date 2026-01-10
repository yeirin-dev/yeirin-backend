import { Inject, Injectable } from '@nestjs/common';
import { DomainError, Result } from '@domain/common/result';
import {
  ChildConsentRepository,
  CompleteConsentStatus,
} from '@domain/consent/repository/child-consent.repository';

/**
 * 완전한 동의 상태 조회 응답 DTO
 */
export interface CompleteConsentStatusResponseDto {
  /** 완전한 동의 여부 */
  isComplete: boolean;
  /** 보호자 동의 존재 여부 */
  hasGuardianConsent: boolean;
  /** 아동 본인 동의 존재 여부 */
  hasChildConsent: boolean;
  /** 필요한 동의 유형 (GUARDIAN, CHILD, BOTH, 또는 완료 시 null) */
  requiredConsent: 'GUARDIAN' | 'CHILD' | 'BOTH' | null;
  /** 요청한 아동의 14세 이상 여부 */
  isOver14: boolean;
}

/**
 * 완전한 동의 상태 조회 요청
 */
export interface GetCompleteConsentStatusRequest {
  childId: string;
  isOver14: boolean;
}

/**
 * 완전한 동의 상태 조회 Use Case
 *
 * @description
 * 14세 기준으로 필요한 동의 상태를 확인합니다.
 * - 14세 미만: 보호자 동의만 필요
 * - 14세 이상: 보호자 동의 + 아동 본인 동의 모두 필요
 */
@Injectable()
export class GetCompleteConsentStatusUseCase {
  constructor(
    @Inject('ChildConsentRepository')
    private readonly consentRepository: ChildConsentRepository,
  ) {}

  async execute(
    request: GetCompleteConsentStatusRequest,
  ): Promise<Result<CompleteConsentStatusResponseDto, DomainError>> {
    const { childId, isOver14 } = request;

    // Repository에서 완전한 동의 상태 조회
    const status: CompleteConsentStatus = await this.consentRepository.getCompleteConsentStatus(
      childId,
      isOver14,
    );

    // 응답 DTO 생성
    const response: CompleteConsentStatusResponseDto = {
      isComplete: status.isComplete,
      hasGuardianConsent: status.hasGuardianConsent,
      hasChildConsent: status.hasChildConsent,
      requiredConsent: status.requiredConsent,
      isOver14,
    };

    return Result.ok(response);
  }
}
