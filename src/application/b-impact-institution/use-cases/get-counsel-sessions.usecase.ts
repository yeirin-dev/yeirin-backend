import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { COUNSEL_SESSION_REPOSITORY, CounselSessionRepository } from '@domain/counsel-session/repository/counsel-session.repository';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { CounselRecordEntity } from '@infrastructure/persistence/typeorm/entity/counsel-record.entity';
import { CounselSessionResponseDto } from '../dto/counsel-session.dto';

@Injectable()
export class GetCounselSessionsUseCase {
  constructor(
    @Inject(COUNSEL_SESSION_REPOSITORY)
    private readonly counselSessionRepository: CounselSessionRepository,
    @InjectRepository(CounselRequestEntity)
    private readonly counselRequestRepository: Repository<CounselRequestEntity>,
    @InjectRepository(CounselRecordEntity)
    private readonly counselRecordRepository: Repository<CounselRecordEntity>,
  ) {}

  async execute(
    institutionId: string,
    startDate: string,
    endDate: string,
  ): Promise<CounselSessionResponseDto[]> {
    const sessions = await this.counselSessionRepository.findByInstitutionIdAndDateRange(
      institutionId,
      new Date(startDate),
      new Date(endDate),
    );

    if (sessions.length === 0) return [];

    // Batch load child names
    const counselRequestIds = [...new Set(sessions.map((s) => s.counselRequestId))];
    const counselRequests = await this.counselRequestRepository.find({
      where: { id: In(counselRequestIds) },
    });
    const crMap = new Map(counselRequests.map((cr) => [cr.id, cr]));

    // Check which sessions have records
    const sessionIds = sessions.map((s) => s.id);
    const existingRecords = await this.counselRecordRepository.find({
      where: { counselSessionId: In(sessionIds) },
      select: ['counselSessionId'],
    });
    const recordSessionIds = new Set(existingRecords.map((r) => r.counselSessionId));

    return sessions.map((s) => {
      const cr = crMap.get(s.counselRequestId);
      const childName = cr?.formData?.basicInfo?.childInfo?.name || '알 수 없음';

      return {
        id: s.id,
        voucherLinkageId: s.voucherLinkageId,
        counselRequestId: s.counselRequestId,
        childId: s.childId,
        childName,
        bImpactInstitutionId: s.bImpactInstitutionId,
        sessionNumber: s.sessionNumber,
        scheduledDate: s.scheduledDate instanceof Date ? s.scheduledDate.toISOString().split('T')[0] : String(s.scheduledDate),
        scheduledStartTime: s.scheduledStartTime,
        scheduledEndTime: s.scheduledEndTime,
        sessionType: s.sessionType,
        status: s.status,
        cancelReason: s.cancelReason,
        notes: s.notes,
        hasRecord: recordSessionIds.has(s.id),
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      };
    });
  }
}
