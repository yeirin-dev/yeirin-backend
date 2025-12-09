import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { CounselRequestStatus } from '@domain/counsel-request/model/value-objects/counsel-request-enums';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import {
  AdminUpdateCounselRequestStatusDto,
  ADMIN_ALLOWED_STATUS_CHANGES,
} from './dto/admin-update-status.dto';

/**
 * Admin 상담의뢰 상태 강제 변경 Use Case
 *
 * 비즈니스 규칙:
 * - COMPLETED 상태인 상담의뢰는 변경 불가
 * - COMPLETED 상태로의 변경 불가 (정상 플로우로만 완료 가능)
 * - 모든 변경에 사유 필수
 */
@Injectable()
export class UpdateCounselRequestStatusAdminUseCase {
  constructor(
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
  ) {}

  async execute(
    id: string,
    dto: AdminUpdateCounselRequestStatusDto,
    adminId: string,
  ): Promise<{ previousStatus: CounselRequestStatus; newStatus: CounselRequestStatus }> {
    // 상담의뢰 조회
    const counselRequest = await this.counselRequestRepository.findById(id);

    if (!counselRequest) {
      throw new NotFoundException(`상담의뢰를 찾을 수 없습니다: ${id}`);
    }

    // 현재 상태가 COMPLETED인 경우 변경 불가
    if (counselRequest.status === CounselRequestStatus.COMPLETED) {
      throw new BadRequestException('완료된 상담의뢰는 상태를 변경할 수 없습니다');
    }

    // COMPLETED 상태로의 변경 불가
    if (dto.newStatus === CounselRequestStatus.COMPLETED) {
      throw new BadRequestException(
        '관리자가 직접 완료 상태로 변경할 수 없습니다. 정상적인 상담 완료 플로우를 사용해주세요.',
      );
    }

    // 허용된 상태인지 확인
    if (!ADMIN_ALLOWED_STATUS_CHANGES.includes(dto.newStatus as any)) {
      throw new BadRequestException(`허용되지 않은 상태입니다: ${dto.newStatus}`);
    }

    // 동일 상태로의 변경 방지
    if (counselRequest.status === dto.newStatus) {
      throw new BadRequestException('현재 상태와 동일한 상태로는 변경할 수 없습니다');
    }

    const previousStatus = counselRequest.status;

    // Domain 메서드를 통한 상태 변경 (Step 5에서 구현 예정)
    const result = counselRequest.adminForceStatus(dto.newStatus, dto.reason);

    if (result.isFailure) {
      throw new BadRequestException(result.getError().message);
    }

    // 저장
    await this.counselRequestRepository.save(counselRequest);

    return {
      previousStatus,
      newStatus: dto.newStatus,
    };
  }
}
