import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { VoucherLinkageRepository, VOUCHER_LINKAGE_REPOSITORY } from '@domain/voucher-linkage/repository/voucher-linkage.repository';

@Injectable()
export class RejectLinkageUseCase {
  constructor(
    @Inject(VOUCHER_LINKAGE_REPOSITORY)
    private readonly voucherLinkageRepository: VoucherLinkageRepository,
  ) {}

  async execute(linkageId: string, institutionId: string, reason: string): Promise<void> {
    const linkage = await this.voucherLinkageRepository.findById(linkageId);

    if (!linkage) {
      throw new NotFoundException('연계 정보를 찾을 수 없습니다');
    }

    // 소유권 검증
    if (linkage.linkedVoucherInstitutionId !== institutionId) {
      throw new ForbiddenException('해당 연계에 대한 권한이 없습니다');
    }

    const result = linkage.rejectByInstitution(reason);
    if (result.isFailure) {
      throw new BadRequestException(result.getError().message);
    }

    await this.voucherLinkageRepository.save(linkage);
  }
}
