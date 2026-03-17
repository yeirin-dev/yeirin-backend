import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { COUNSEL_SESSION_REPOSITORY, CounselSessionRepository } from '@domain/counsel-session/repository/counsel-session.repository';
import { VOUCHER_LINKAGE_REPOSITORY, VoucherLinkageRepository } from '@domain/voucher-linkage/repository/voucher-linkage.repository';
import { CounselSession } from '@domain/counsel-session/model/counsel-session';
import { Result, DomainError } from '@domain/common/result';
import { CreateCounselSessionDto, CounselSessionResponseDto } from '../dto/counsel-session.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';

@Injectable()
export class CreateCounselSessionUseCase {
  constructor(
    @Inject(COUNSEL_SESSION_REPOSITORY)
    private readonly counselSessionRepository: CounselSessionRepository,
    @Inject(VOUCHER_LINKAGE_REPOSITORY)
    private readonly voucherLinkageRepository: VoucherLinkageRepository,
    @InjectRepository(CounselRequestEntity)
    private readonly counselRequestRepository: Repository<CounselRequestEntity>,
    @InjectRepository(ChildProfileEntity)
    private readonly childProfileRepository: Repository<ChildProfileEntity>,
  ) {}

  async execute(
    dto: CreateCounselSessionDto,
    institutionId: string,
  ): Promise<Result<CounselSessionResponseDto, DomainError>> {
    const linkage = await this.voucherLinkageRepository.findById(dto.voucherLinkageId);
    if (!linkage) {
      return Result.fail(new DomainError('연계 정보를 찾을 수 없습니다', 'LINKAGE_NOT_FOUND'));
    }

    if (linkage.linkedVoucherInstitutionId !== institutionId) {
      return Result.fail(new DomainError('해당 기관의 연계 정보가 아닙니다', 'FORBIDDEN'));
    }

    if (!linkage.isCompleted()) {
      return Result.fail(new DomainError('수락 완료된 연계만 상담을 등록할 수 있습니다', 'LINKAGE_NOT_COMPLETED'));
    }

    const counselRequest = await this.counselRequestRepository.findOne({
      where: { id: linkage.counselRequestId },
    });

    if (!counselRequest) {
      return Result.fail(new DomainError('상담의뢰를 찾을 수 없습니다', 'REQUEST_NOT_FOUND'));
    }

    const sessionNumber = await this.counselSessionRepository.getNextSessionNumber(
      dto.voucherLinkageId,
    );

    const sessionResult = CounselSession.create({
      id: uuidv4(),
      voucherLinkageId: dto.voucherLinkageId,
      counselRequestId: linkage.counselRequestId,
      childId: counselRequest.childId,
      bImpactInstitutionId: institutionId,
      sessionNumber,
      scheduledDate: new Date(dto.scheduledDate),
      scheduledStartTime: dto.scheduledStartTime,
      scheduledEndTime: dto.scheduledEndTime,
      sessionType: dto.sessionType,
      notes: dto.notes,
    });

    if (sessionResult.isFailure) {
      return Result.fail(sessionResult.getError());
    }

    const saved = await this.counselSessionRepository.save(sessionResult.getValue());
    const childName = counselRequest.formData?.basicInfo?.childInfo?.name || '알 수 없음';

    // 시설 연락처 정보 조회
    let facilityContactInfo: CounselSessionResponseDto['facilityContactInfo'] = undefined;
    try {
      const childProfile = await this.childProfileRepository.findOne({
        where: { id: counselRequest.childId },
        relations: ['careFacility', 'communityChildCenter', 'educationWelfareSchool'],
      });

      if (childProfile) {
        if (childProfile.careFacility) {
          const facility = childProfile.careFacility;
          const contacts: Array<{ label: string; name?: string; phone: string }> = [];
          if (facility.phoneNumber) {
            contacts.push({ label: '대표', name: facility.representativeName, phone: facility.phoneNumber });
          }
          if (contacts.length > 0) {
            facilityContactInfo = { facilityName: facility.name, careType: '양육시설', contacts };
          }
        } else if (childProfile.communityChildCenter) {
          const center = childProfile.communityChildCenter;
          const contacts: Array<{ label: string; name?: string; phone: string }> = [];
          if (center.phoneNumber) {
            contacts.push({ label: '센터장', name: center.directorName, phone: center.phoneNumber });
          }
          if (center.managerPhone) {
            contacts.push({ label: '담당자', name: center.managerName ?? undefined, phone: center.managerPhone });
          }
          if (contacts.length > 0) {
            facilityContactInfo = { facilityName: center.name, careType: '지역아동센터', contacts };
          }
        } else if (childProfile.educationWelfareSchool) {
          const school = childProfile.educationWelfareSchool;
          const contacts: Array<{ label: string; name?: string; phone: string }> = [];
          if (school.welfareWorkerPhone) {
            contacts.push({ label: '교육복지사', name: school.welfareWorkerName, phone: school.welfareWorkerPhone });
          }
          if (school.phoneNumber) {
            contacts.push({ label: '교육복지실', phone: school.phoneNumber });
          }
          if (contacts.length > 0) {
            facilityContactInfo = { facilityName: school.name, careType: '교육복지학교', contacts };
          }
        }
      }
    } catch {
      // 시설 정보 조회 실패 시 무시 (핵심 기능이 아님)
    }

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
      facilityContactInfo,
    });
  }
}
