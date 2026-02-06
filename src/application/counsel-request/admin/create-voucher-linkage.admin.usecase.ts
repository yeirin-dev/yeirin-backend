import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import {
  VoucherLinkageRepository,
  VOUCHER_LINKAGE_REPOSITORY,
} from '@domain/voucher-linkage/repository/voucher-linkage.repository';
import { VoucherLinkage } from '@domain/voucher-linkage/model/voucher-linkage';
import { CreateVoucherLinkageDto } from './dto/voucher-linkage.dto';
import { VoucherLinkageResponseDto } from './dto/admin-counsel-request-response.dto';
import { VoucherLinkageStatus } from '@domain/voucher-linkage/model/voucher-linkage';

/**
 * Admin 바우처 연계 생성 Use Case
 * 바우처 추천대상 상담의뢰지에 연계 정보 생성 (PENDING 상태)
 */
@Injectable()
export class CreateVoucherLinkageAdminUseCase {
  constructor(
    @InjectRepository(CounselRequestEntity)
    private readonly counselRequestRepository: Repository<CounselRequestEntity>,
    @Inject(VOUCHER_LINKAGE_REPOSITORY)
    private readonly voucherLinkageRepository: VoucherLinkageRepository,
  ) {}

  async execute(
    counselRequestId: string,
    dto: CreateVoucherLinkageDto,
    adminId?: string,
  ): Promise<VoucherLinkageResponseDto> {
    // 상담의뢰 존재 확인
    const counselRequest = await this.counselRequestRepository.findOne({
      where: { id: counselRequestId },
    });

    if (!counselRequest) {
      throw new NotFoundException(`상담의뢰를 찾을 수 없습니다: ${counselRequestId}`);
    }

    // 바우처 추천대상 여부 확인
    if (!counselRequest.isVoucherEligible) {
      throw new ConflictException('바우처 추천대상이 아닌 상담의뢰입니다');
    }

    // 기존 연계 정보 확인
    const existingLinkage =
      await this.voucherLinkageRepository.findByCounselRequestId(counselRequestId);
    if (existingLinkage) {
      throw new ConflictException('이미 바우처 연계 정보가 존재합니다');
    }

    // 새 연계 정보 생성
    const linkageResult = VoucherLinkage.create({
      id: uuid(),
      counselRequestId,
      createdBy: adminId,
      notes: dto.notes,
    });

    if (linkageResult.isFailure) {
      throw new ConflictException(linkageResult.getError().message);
    }

    const savedLinkage = await this.voucherLinkageRepository.save(linkageResult.getValue());

    return {
      id: savedLinkage.id,
      status: savedLinkage.status,
      linkedInstitutionName: savedLinkage.linkedInstitutionName,
      linkedInstitutionPhone: savedLinkage.linkedInstitutionPhone,
      linkedInstitutionAddress: savedLinkage.linkedInstitutionAddress,
      linkedCounselorName: savedLinkage.linkedCounselorName,
      linkedAt: savedLinkage.linkedAt,
      notes: savedLinkage.notes,
      createdAt: savedLinkage.createdAt,
      updatedAt: savedLinkage.updatedAt,
    };
  }
}
