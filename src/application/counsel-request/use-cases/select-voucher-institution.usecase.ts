import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn } from 'class-validator';
import { VOUCHER_LINKAGE_REPOSITORY } from '@domain/voucher-linkage/repository/voucher-linkage.repository';
import { VoucherLinkageRepository } from '@domain/voucher-linkage/repository/voucher-linkage.repository';
import { BImpactVoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/b-impact-voucher-institution.entity';
import { CommonVoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/common-voucher-institution.entity';

export class SelectVoucherInstitutionDto {
  @ApiProperty({ description: '바우처 기관 ID' })
  @IsNotEmpty()
  @IsString()
  institutionId: string;

  @ApiProperty({ description: '기관 유형', enum: ['B_IMPACT', 'COMMON'] })
  @IsNotEmpty()
  @IsIn(['B_IMPACT', 'COMMON'])
  institutionType: 'B_IMPACT' | 'COMMON';
}

export interface SelectVoucherInstitutionResponseDto {
  success: boolean;
  linkedVoucherInstitutionId: string;
  linkedVoucherInstitutionType: string;
  institutionName: string;
}

@Injectable()
export class SelectVoucherInstitutionUseCase {
  constructor(
    @Inject(VOUCHER_LINKAGE_REPOSITORY)
    private readonly voucherLinkageRepository: VoucherLinkageRepository,
    @InjectRepository(BImpactVoucherInstitutionEntity)
    private readonly bImpactRepository: Repository<BImpactVoucherInstitutionEntity>,
    @InjectRepository(CommonVoucherInstitutionEntity)
    private readonly commonRepository: Repository<CommonVoucherInstitutionEntity>,
  ) {}

  async execute(
    counselRequestId: string,
    dto: SelectVoucherInstitutionDto,
  ): Promise<SelectVoucherInstitutionResponseDto> {
    // 1. 기관 존재 확인
    let institutionName: string;

    if (dto.institutionType === 'B_IMPACT') {
      const institution = await this.bImpactRepository.findOne({
        where: { id: dto.institutionId },
      });
      if (!institution) {
        throw new NotFoundException(`B-IMPACT 기관을 찾을 수 없습니다: ${dto.institutionId}`);
      }
      institutionName = institution.name;
    } else {
      const institution = await this.commonRepository.findOne({
        where: { id: dto.institutionId },
      });
      if (!institution) {
        throw new NotFoundException(`일반 바우처 기관을 찾을 수 없습니다: ${dto.institutionId}`);
      }
      institutionName = institution.name;
    }

    // 2. VoucherLinkage 조회
    const linkage =
      await this.voucherLinkageRepository.findByCounselRequestId(counselRequestId);

    if (!linkage) {
      throw new NotFoundException(`바우처 연계 정보를 찾을 수 없습니다: ${counselRequestId}`);
    }

    // 3. 기관 선택
    const selectResult = linkage.selectVoucherInstitution(
      dto.institutionId,
      dto.institutionType,
    );

    if (selectResult.isFailure) {
      throw new ConflictException(selectResult.getError().message);
    }

    // 4. 저장
    await this.voucherLinkageRepository.save(linkage);

    return {
      success: true,
      linkedVoucherInstitutionId: dto.institutionId,
      linkedVoucherInstitutionType: dto.institutionType,
      institutionName,
    };
  }
}
