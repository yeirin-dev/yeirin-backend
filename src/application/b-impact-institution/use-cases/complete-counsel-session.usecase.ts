import { Inject, Injectable } from '@nestjs/common';
import { COUNSEL_SESSION_REPOSITORY, CounselSessionRepository } from '@domain/counsel-session/repository/counsel-session.repository';
import { Result, DomainError } from '@domain/common/result';

@Injectable()
export class CompleteCounselSessionUseCase {
  constructor(
    @Inject(COUNSEL_SESSION_REPOSITORY)
    private readonly counselSessionRepository: CounselSessionRepository,
  ) {}

  async execute(
    sessionId: string,
    institutionId: string,
  ): Promise<Result<void, DomainError>> {
    const session = await this.counselSessionRepository.findById(sessionId);
    if (!session) {
      return Result.fail(new DomainError('상담 세션을 찾을 수 없습니다', 'SESSION_NOT_FOUND'));
    }

    if (session.bImpactInstitutionId !== institutionId) {
      return Result.fail(new DomainError('해당 기관의 상담 세션이 아닙니다', 'FORBIDDEN'));
    }

    const completeResult = session.complete();
    if (completeResult.isFailure) {
      return Result.fail(completeResult.getError());
    }

    await this.counselSessionRepository.save(session);
    return Result.ok(undefined);
  }
}
