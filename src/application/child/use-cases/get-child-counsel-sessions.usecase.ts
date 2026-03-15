import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ChildRepository } from '@domain/child/repository/child.repository';
import {
  CounselSessionRepository,
  COUNSEL_SESSION_REPOSITORY,
} from '@domain/counsel-session/repository/counsel-session.repository';
import {
  CounselRecordRepository,
  COUNSEL_RECORD_REPOSITORY,
} from '@domain/counsel-record/repository/counsel-record.repository';

@Injectable()
export class GetChildCounselSessionsUseCase {
  constructor(
    @Inject('ChildRepository')
    private readonly childRepository: ChildRepository,
    @Inject(COUNSEL_SESSION_REPOSITORY)
    private readonly counselSessionRepository: CounselSessionRepository,
    @Inject(COUNSEL_RECORD_REPOSITORY)
    private readonly counselRecordRepository: CounselRecordRepository,
  ) {}

  async execute(childId: string, user: { role: string; institutionId?: string }) {
    const child = await this.childRepository.findById(childId);
    if (!child) {
      throw new NotFoundException('아동을 찾을 수 없습니다.');
    }

    if (user.role === 'INSTITUTION' && user.institutionId) {
      const hasPermission =
        (child.careFacilityId && child.careFacilityId === user.institutionId) ||
        (child.communityChildCenterId && child.communityChildCenterId === user.institutionId) ||
        (child.educationWelfareSchoolId && child.educationWelfareSchoolId === user.institutionId);
      if (!hasPermission) {
        throw new ForbiddenException('이 아동의 상담 세션을 조회할 권한이 없습니다.');
      }
    }

    const sessions = await this.counselSessionRepository.findByChildId(childId);
    const records = await this.counselRecordRepository.findByChildId(childId);
    const sessionIdsWithRecords = new Set(records.map((r) => r.counselSessionId));

    return sessions.map((s) => ({
      id: s.id,
      childName: child.name.value,
      sessionNumber: s.sessionNumber,
      scheduledDate:
        s.scheduledDate instanceof Date
          ? s.scheduledDate.toISOString().split('T')[0]
          : String(s.scheduledDate),
      scheduledStartTime: s.scheduledStartTime,
      scheduledEndTime: s.scheduledEndTime,
      sessionType: s.sessionType,
      status: s.status,
      cancelReason: s.cancelReason,
      hasRecord: sessionIdsWithRecords.has(s.id),
      createdAt: s.createdAt.toISOString(),
    }));
  }
}
