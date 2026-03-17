import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { COUNSEL_SESSION_REPOSITORY, CounselSessionRepository } from '@domain/counsel-session/repository/counsel-session.repository';
import { COUNSEL_RECORD_REPOSITORY, CounselRecordRepository } from '@domain/counsel-record/repository/counsel-record.repository';
import { CounselRecord } from '@domain/counsel-record/model/counsel-record';
import { Result, DomainError } from '@domain/common/result';
import { CreateCounselRecordDto, CounselRecordResponseDto } from '../dto/counsel-record.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';

@Injectable()
export class CreateCounselRecordUseCase {
  constructor(
    @Inject(COUNSEL_SESSION_REPOSITORY)
    private readonly counselSessionRepository: CounselSessionRepository,
    @Inject(COUNSEL_RECORD_REPOSITORY)
    private readonly counselRecordRepository: CounselRecordRepository,
    @InjectRepository(CounselRequestEntity)
    private readonly counselRequestRepository: Repository<CounselRequestEntity>,
  ) {}

  async execute(
    dto: CreateCounselRecordDto,
    institutionId: string,
  ): Promise<Result<CounselRecordResponseDto, DomainError>> {
    const session = await this.counselSessionRepository.findById(dto.counselSessionId);
    if (!session) {
      return Result.fail(new DomainError('상담 세션을 찾을 수 없습니다', 'SESSION_NOT_FOUND'));
    }

    if (session.bImpactInstitutionId !== institutionId) {
      return Result.fail(new DomainError('해당 기관의 상담 세션이 아닙니다', 'FORBIDDEN'));
    }

    // Check for existing record on this session
    const existingRecord = await this.counselRecordRepository.findByCounselSessionId(
      dto.counselSessionId,
    );
    if (existingRecord) {
      return Result.fail(
        new DomainError('이미 해당 세션에 상담 기록이 존재합니다', 'RECORD_ALREADY_EXISTS'),
      );
    }

    const recordResult = CounselRecord.create({
      id: uuidv4(),
      counselSessionId: dto.counselSessionId,
      voucherLinkageId: session.voucherLinkageId,
      counselRequestId: session.counselRequestId,
      childId: session.childId,
      bImpactInstitutionId: institutionId,
      sessionNumber: session.sessionNumber,
      recordDate: new Date(),
      counselContent: dto.counselContent,
      childObservation: dto.childObservation,
      counselorOpinion: dto.counselorOpinion,
      nextSessionPlan: dto.nextSessionPlan,
      feedbackToGuardian: dto.feedbackToGuardian,
      additionalCounselingNeeded: dto.additionalCounselingNeeded,
      attachmentUrls: dto.attachmentUrls,
    });

    if (recordResult.isFailure) {
      return Result.fail(recordResult.getError());
    }

    const saved = await this.counselRecordRepository.save(recordResult.getValue());

    const cr = await this.counselRequestRepository.findOne({
      where: { id: saved.counselRequestId },
    });
    const childName = cr?.formData?.basicInfo?.childInfo?.name || '알 수 없음';

    return Result.ok({
      id: saved.id,
      counselSessionId: saved.counselSessionId,
      voucherLinkageId: saved.voucherLinkageId,
      counselRequestId: saved.counselRequestId,
      childId: saved.childId,
      childName,
      bImpactInstitutionId: saved.bImpactInstitutionId,
      sessionNumber: saved.sessionNumber,
      recordDate: saved.recordDate instanceof Date ? saved.recordDate.toISOString().split('T')[0] : String(saved.recordDate),
      counselContent: saved.counselContent,
      childObservation: saved.childObservation,
      counselorOpinion: saved.counselorOpinion,
      nextSessionPlan: saved.nextSessionPlan,
      feedbackToGuardian: saved.feedbackToGuardian,
      additionalCounselingNeeded: saved.additionalCounselingNeeded,
      attachmentUrls: saved.attachmentUrls,
      status: saved.status,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    });
  }
}
