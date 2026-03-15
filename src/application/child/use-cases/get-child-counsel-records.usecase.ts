import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ChildRepository } from '@domain/child/repository/child.repository';
import {
  CounselRecordRepository,
  COUNSEL_RECORD_REPOSITORY,
} from '@domain/counsel-record/repository/counsel-record.repository';

@Injectable()
export class GetChildCounselRecordsUseCase {
  constructor(
    @Inject('ChildRepository')
    private readonly childRepository: ChildRepository,
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
        throw new ForbiddenException('이 아동의 상담 기록을 조회할 권한이 없습니다.');
      }
    }

    const records = await this.counselRecordRepository.findByChildId(childId);

    // Only return SHARED records
    const sharedRecords = records.filter((r) => r.status === 'SHARED');

    return sharedRecords.map((r) => ({
      id: r.id,
      childName: child.name.value,
      sessionNumber: r.sessionNumber,
      recordDate:
        r.recordDate instanceof Date
          ? r.recordDate.toISOString().split('T')[0]
          : String(r.recordDate),
      status: r.status,
      aiSummaryForGuardian: r.aiSummaryForGuardian || '',
      sharedAt: r.sharedAt?.toISOString() || '',
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
