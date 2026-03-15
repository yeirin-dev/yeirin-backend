import { Inject, Injectable } from '@nestjs/common';
import { COUNSEL_RECORD_REPOSITORY, CounselRecordRepository } from '@domain/counsel-record/repository/counsel-record.repository';
import { Result, DomainError } from '@domain/common/result';

@Injectable()
export class ShareCounselRecordUseCase {
  constructor(
    @Inject(COUNSEL_RECORD_REPOSITORY)
    private readonly counselRecordRepository: CounselRecordRepository,
  ) {}

  async execute(
    recordId: string,
    institutionId: string,
  ): Promise<Result<void, DomainError>> {
    const record = await this.counselRecordRepository.findById(recordId);
    if (!record) {
      return Result.fail(new DomainError('상담 기록을 찾을 수 없습니다', 'RECORD_NOT_FOUND'));
    }

    if (record.bImpactInstitutionId !== institutionId) {
      return Result.fail(new DomainError('해당 기관의 상담 기록이 아닙니다', 'FORBIDDEN'));
    }

    const shareResult = record.share();
    if (shareResult.isFailure) {
      return Result.fail(shareResult.getError());
    }

    await this.counselRecordRepository.save(record);
    return Result.ok(undefined);
  }
}
