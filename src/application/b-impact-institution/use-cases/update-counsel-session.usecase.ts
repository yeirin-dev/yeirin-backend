import { Inject, Injectable } from '@nestjs/common';
import { COUNSEL_SESSION_REPOSITORY, CounselSessionRepository } from '@domain/counsel-session/repository/counsel-session.repository';
import { Result, DomainError } from '@domain/common/result';
import { UpdateCounselSessionDto, CounselSessionResponseDto } from '../dto/counsel-session.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';

@Injectable()
export class UpdateCounselSessionUseCase {
  constructor(
    @Inject(COUNSEL_SESSION_REPOSITORY)
    private readonly counselSessionRepository: CounselSessionRepository,
    @InjectRepository(CounselRequestEntity)
    private readonly counselRequestRepository: Repository<CounselRequestEntity>,
  ) {}

  async execute(
    sessionId: string,
    dto: UpdateCounselSessionDto,
    institutionId: string,
  ): Promise<Result<CounselSessionResponseDto, DomainError>> {
    const session = await this.counselSessionRepository.findById(sessionId);
    if (!session) {
      return Result.fail(new DomainError('상담 세션을 찾을 수 없습니다', 'SESSION_NOT_FOUND'));
    }

    if (session.bImpactInstitutionId !== institutionId) {
      return Result.fail(new DomainError('해당 기관의 상담 세션이 아닙니다', 'FORBIDDEN'));
    }

    const updateResult = session.updateSchedule({
      scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
      scheduledStartTime: dto.scheduledStartTime,
      scheduledEndTime: dto.scheduledEndTime,
      sessionType: dto.sessionType,
      notes: dto.notes,
    });

    if (updateResult.isFailure) {
      return Result.fail(updateResult.getError());
    }

    const saved = await this.counselSessionRepository.save(session);
    const cr = await this.counselRequestRepository.findOne({
      where: { id: saved.counselRequestId },
    });
    const childName = cr?.formData?.basicInfo?.childInfo?.name || '알 수 없음';

    return Result.ok({
      id: saved.id,
      voucherLinkageId: saved.voucherLinkageId,
      counselRequestId: saved.counselRequestId,
      childId: saved.childId,
      childName,
      bImpactInstitutionId: saved.bImpactInstitutionId,
      sessionNumber: saved.sessionNumber,
      scheduledDate: saved.scheduledDate instanceof Date ? saved.scheduledDate.toISOString().split('T')[0] : String(saved.scheduledDate),
      scheduledStartTime: saved.scheduledStartTime,
      scheduledEndTime: saved.scheduledEndTime,
      sessionType: saved.sessionType,
      status: saved.status,
      cancelReason: saved.cancelReason,
      notes: saved.notes,
      hasRecord: false,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    });
  }
}
