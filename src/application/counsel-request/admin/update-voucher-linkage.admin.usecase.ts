import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import {
  VoucherLinkageRepository,
  VOUCHER_LINKAGE_REPOSITORY,
} from '@domain/voucher-linkage/repository/voucher-linkage.repository';
import { VoucherLinkageStatus } from '@domain/voucher-linkage/model/voucher-linkage';
import { UpdateVoucherLinkageDto, CompleteVoucherLinkageDto } from './dto/voucher-linkage.dto';
import { VoucherLinkageResponseDto } from './dto/admin-counsel-request-response.dto';

/**
 * Admin 바우처 연계 수정 Use Case
 * 연계 정보 수정 및 연계 완료 처리
 */
@Injectable()
export class UpdateVoucherLinkageAdminUseCase {
  constructor(
    @Inject(VOUCHER_LINKAGE_REPOSITORY)
    private readonly voucherLinkageRepository: VoucherLinkageRepository,
  ) {}

  /**
   * 바우처 연계 정보 수정
   */
  async execute(
    counselRequestId: string,
    dto: UpdateVoucherLinkageDto,
    adminId?: string,
  ): Promise<VoucherLinkageResponseDto> {
    // 연계 정보 조회
    const linkage = await this.voucherLinkageRepository.findByCounselRequestId(counselRequestId);

    if (!linkage) {
      throw new NotFoundException(`바우처 연계 정보를 찾을 수 없습니다: ${counselRequestId}`);
    }

    // 상태 변경이 COMPLETED인 경우 기관 정보 필수 확인
    if (dto.status === VoucherLinkageStatus.COMPLETED) {
      if (!dto.linkedInstitutionName && !linkage.linkedInstitutionName) {
        throw new ConflictException('연계 완료 시 기관명은 필수입니다');
      }
    }

    // 연계 정보 수정
    const updateResult = linkage.update({
      linkedInstitutionName: dto.linkedInstitutionName,
      linkedInstitutionPhone: dto.linkedInstitutionPhone,
      linkedInstitutionAddress: dto.linkedInstitutionAddress,
      linkedCounselorName: dto.linkedCounselorName,
      linkedAt: dto.linkedAt ? new Date(dto.linkedAt) : undefined,
      notes: dto.notes,
      updatedBy: adminId,
    });

    if (updateResult.isFailure) {
      throw new ConflictException(updateResult.getError().message);
    }

    // 상태 변경이 있는 경우
    if (dto.status && dto.status !== linkage.status) {
      const statusResult = linkage.changeStatus(dto.status, adminId);
      if (statusResult.isFailure) {
        throw new ConflictException(statusResult.getError().message);
      }
    }

    const savedLinkage = await this.voucherLinkageRepository.save(linkage);

    return this.toResponseDto(savedLinkage);
  }

  /**
   * 바우처 연계 완료 처리
   */
  async completeLinkage(
    counselRequestId: string,
    dto: CompleteVoucherLinkageDto,
    adminId?: string,
  ): Promise<VoucherLinkageResponseDto> {
    // 연계 정보 조회
    const linkage = await this.voucherLinkageRepository.findByCounselRequestId(counselRequestId);

    if (!linkage) {
      throw new NotFoundException(`바우처 연계 정보를 찾을 수 없습니다: ${counselRequestId}`);
    }

    // 이미 완료된 경우
    if (linkage.isCompleted()) {
      throw new ConflictException('이미 연계 완료된 상태입니다');
    }

    // 연계 완료 처리
    const completeResult = linkage.completeLinkage({
      linkedInstitutionName: dto.linkedInstitutionName,
      linkedInstitutionPhone: dto.linkedInstitutionPhone,
      linkedInstitutionAddress: dto.linkedInstitutionAddress,
      linkedCounselorName: dto.linkedCounselorName,
      linkedAt: dto.linkedAt ? new Date(dto.linkedAt) : undefined,
      notes: dto.notes,
      updatedBy: adminId,
    });

    if (completeResult.isFailure) {
      throw new ConflictException(completeResult.getError().message);
    }

    const savedLinkage = await this.voucherLinkageRepository.save(linkage);

    return this.toResponseDto(savedLinkage);
  }

  private toResponseDto(linkage: {
    id: string;
    status: VoucherLinkageStatus;
    linkedInstitutionName?: string;
    linkedInstitutionPhone?: string;
    linkedInstitutionAddress?: string;
    linkedCounselorName?: string;
    linkedAt?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
  }): VoucherLinkageResponseDto {
    return {
      id: linkage.id,
      status: linkage.status,
      linkedInstitutionName: linkage.linkedInstitutionName,
      linkedInstitutionPhone: linkage.linkedInstitutionPhone,
      linkedInstitutionAddress: linkage.linkedInstitutionAddress,
      linkedCounselorName: linkage.linkedCounselorName,
      linkedAt: linkage.linkedAt,
      notes: linkage.notes,
      createdAt: linkage.createdAt,
      updatedAt: linkage.updatedAt,
    };
  }
}
