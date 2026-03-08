import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { VoucherLinkage } from '@domain/voucher-linkage/model/voucher-linkage';
import {
  VoucherLinkageRepository,
  VOUCHER_LINKAGE_REPOSITORY,
} from '@domain/voucher-linkage/repository/voucher-linkage.repository';

export class SubmitLinkageInfoDto {
  @IsBoolean()
  isVoucherConfirmed: boolean;

  @IsOptional()
  @IsString()
  voucherType?: string;

  @IsBoolean()
  wantsPlatformLinkage: boolean;

  @IsOptional()
  @IsString()
  linkageDeclineReason?: string;
}

export interface LinkageInfoResponseDto {
  id: string;
  counselRequestId: string;
  isVoucherConfirmed?: boolean;
  voucherType?: string;
  wantsPlatformLinkage?: boolean;
  linkageDeclineReason?: string;
  linkageInfoSubmitted: boolean;
  linkedVoucherInstitutionId?: string;
  linkedVoucherInstitutionType?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Guardian 연계 정보 제출 UseCase
 * 바우처 선정 아동에 대한 연계 정보를 guardian이 제출합니다.
 */
@Injectable()
export class SubmitLinkageInfoUseCase {
  constructor(
    @InjectRepository(CounselRequestEntity)
    private readonly counselRequestRepository: Repository<CounselRequestEntity>,
    @Inject(VOUCHER_LINKAGE_REPOSITORY)
    private readonly voucherLinkageRepository: VoucherLinkageRepository,
  ) {}

  async execute(
    counselRequestId: string,
    dto: SubmitLinkageInfoDto,
  ): Promise<LinkageInfoResponseDto> {
    // 상담의뢰 존재 + 바우처 적격 확인
    const counselRequest = await this.counselRequestRepository.findOne({
      where: { id: counselRequestId },
    });

    if (!counselRequest) {
      throw new NotFoundException(`상담의뢰를 찾을 수 없습니다: ${counselRequestId}`);
    }

    if (!counselRequest.isVoucherEligible) {
      throw new ConflictException('바우처 추천대상이 아닌 상담의뢰입니다');
    }

    // 기존 연계 정보 확인
    let linkage = await this.voucherLinkageRepository.findByCounselRequestId(counselRequestId);

    if (linkage) {
      // 이미 제출된 경우 업데이트
      const submitResult = linkage.submitLinkageInfo({
        isVoucherConfirmed: dto.isVoucherConfirmed,
        voucherType: dto.voucherType,
        wantsPlatformLinkage: dto.wantsPlatformLinkage,
        linkageDeclineReason: dto.linkageDeclineReason,
      });

      if (submitResult.isFailure) {
        throw new ConflictException(submitResult.getError().message);
      }
    } else {
      // 새로 생성
      const createResult = VoucherLinkage.create({
        id: uuid(),
        counselRequestId,
      });

      if (createResult.isFailure) {
        throw new ConflictException(createResult.getError().message);
      }

      linkage = createResult.getValue();

      const submitResult = linkage.submitLinkageInfo({
        isVoucherConfirmed: dto.isVoucherConfirmed,
        voucherType: dto.voucherType,
        wantsPlatformLinkage: dto.wantsPlatformLinkage,
        linkageDeclineReason: dto.linkageDeclineReason,
      });

      if (submitResult.isFailure) {
        throw new ConflictException(submitResult.getError().message);
      }
    }

    const saved = await this.voucherLinkageRepository.save(linkage);

    return this.toResponseDto(saved);
  }

  async getLinkageInfo(counselRequestId: string): Promise<LinkageInfoResponseDto | null> {
    const linkage = await this.voucherLinkageRepository.findByCounselRequestId(counselRequestId);
    if (!linkage) return null;
    return this.toResponseDto(linkage);
  }

  private toResponseDto(linkage: VoucherLinkage): LinkageInfoResponseDto {
    return {
      id: linkage.id,
      counselRequestId: linkage.counselRequestId,
      isVoucherConfirmed: linkage.isVoucherConfirmed,
      voucherType: linkage.voucherType,
      wantsPlatformLinkage: linkage.wantsPlatformLinkage,
      linkageDeclineReason: linkage.linkageDeclineReason,
      linkageInfoSubmitted: linkage.linkageInfoSubmitted,
      linkedVoucherInstitutionId: linkage.linkedVoucherInstitutionId,
      linkedVoucherInstitutionType: linkage.linkedVoucherInstitutionType,
      createdAt: linkage.createdAt,
      updatedAt: linkage.updatedAt,
    };
  }
}
