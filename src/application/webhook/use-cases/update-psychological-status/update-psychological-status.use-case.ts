import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PsychologicalStatus,
  PsychologicalStatusValue,
} from '@domain/child/model/value-objects/psychological-status.vo';
import { ChildRepository } from '@domain/child/repository/child.repository';
import {
  UpdatePsychologicalStatusDto,
  UpdatePsychologicalStatusResponseDto,
} from '@application/webhook/dto/update-psychological-status.dto';
import { PsychologicalStatus as PsychologicalStatusEnum } from '@infrastructure/persistence/typeorm/entity/enums/psychological-status.enum';
import { PsychologicalStatusLogEntity } from '@infrastructure/persistence/typeorm/entity/psychological-status-log.entity';

/**
 * 심리 상태 업데이트 UseCase
 *
 * Soul-E 챗봇에서 위험 징후를 감지하면 이 UseCase를 통해
 * 아동의 심리 상태를 업데이트하고 로그를 기록합니다.
 */
@Injectable()
export class UpdatePsychologicalStatusUseCase {
  private readonly logger = new Logger(UpdatePsychologicalStatusUseCase.name);

  constructor(
    @Inject('ChildRepository')
    private readonly childRepository: ChildRepository,
    @InjectRepository(PsychologicalStatusLogEntity)
    private readonly logRepository: Repository<PsychologicalStatusLogEntity>,
  ) {}

  async execute(dto: UpdatePsychologicalStatusDto): Promise<UpdatePsychologicalStatusResponseDto> {
    // 1. 아동 조회
    const child = await this.childRepository.findById(dto.childId);
    if (!child) {
      throw new NotFoundException(`아동을 찾을 수 없습니다: ${dto.childId}`);
    }

    // 2. 이전 상태 저장
    const previousStatusEnum = this.mapDomainToEnum(child.psychologicalStatus.value);

    // 3. 새로운 상태 생성
    const newStatusResult = PsychologicalStatus.create(this.mapEnumToDomain(dto.newStatus));
    if (newStatusResult.isFailure) {
      throw new BadRequestException('유효하지 않은 심리 상태입니다');
    }

    // 4. 상태 업데이트
    const updateResult = child.updatePsychologicalStatus(newStatusResult.getValue());
    if (updateResult.isFailure) {
      throw new BadRequestException(updateResult.getError().message);
    }

    const { isEscalation, isDeescalation } = updateResult.getValue();

    // 동일한 상태면 로그 생성 없이 반환
    if (!isEscalation && !isDeescalation) {
      this.logger.log(
        `[Webhook] 심리 상태 변경 없음 - childId: ${dto.childId}, status: ${dto.newStatus}`,
      );
      return {
        childId: dto.childId,
        previousStatus: previousStatusEnum,
        newStatus: dto.newStatus,
        isEscalation: false,
        logId: '', // 로그 생성 없음
        processedAt: new Date(),
      };
    }

    // 5. 아동 저장
    await this.childRepository.save(child);

    // 6. 로그 생성
    const log = this.logRepository.create({
      childId: dto.childId,
      previousStatus: previousStatusEnum,
      newStatus: dto.newStatus,
      reason: dto.reason,
      source: 'SOUL_E',
      sessionId: dto.sessionId ?? null,
      isEscalation,
      metadata: dto.metadata ?? null,
    });
    const savedLog = await this.logRepository.save(log);

    // 7. 로깅
    this.logger.log(
      `[Webhook] 심리 상태 변경 - childId: ${dto.childId}, ` +
        `${previousStatusEnum} → ${dto.newStatus}, ` +
        `escalation: ${isEscalation}, logId: ${savedLog.id}`,
    );

    if (isEscalation) {
      this.logger.warn(
        `[ALERT] 위험도 상승 감지 - childId: ${dto.childId}, ` +
          `newStatus: ${dto.newStatus}, reason: ${dto.reason}`,
      );
    }

    return {
      childId: dto.childId,
      previousStatus: previousStatusEnum,
      newStatus: dto.newStatus,
      isEscalation,
      logId: savedLog.id,
      processedAt: savedLog.createdAt,
    };
  }

  /**
   * Domain → Infrastructure Enum
   */
  private mapDomainToEnum(domainValue: PsychologicalStatusValue): PsychologicalStatusEnum {
    const mapping: Record<PsychologicalStatusValue, PsychologicalStatusEnum> = {
      [PsychologicalStatusValue.NORMAL]: PsychologicalStatusEnum.NORMAL,
      [PsychologicalStatusValue.AT_RISK]: PsychologicalStatusEnum.AT_RISK,
      [PsychologicalStatusValue.HIGH_RISK]: PsychologicalStatusEnum.HIGH_RISK,
    };
    return mapping[domainValue];
  }

  /**
   * Infrastructure Enum → Domain
   */
  private mapEnumToDomain(enumValue: PsychologicalStatusEnum): PsychologicalStatusValue {
    const mapping: Record<PsychologicalStatusEnum, PsychologicalStatusValue> = {
      [PsychologicalStatusEnum.NORMAL]: PsychologicalStatusValue.NORMAL,
      [PsychologicalStatusEnum.AT_RISK]: PsychologicalStatusValue.AT_RISK,
      [PsychologicalStatusEnum.HIGH_RISK]: PsychologicalStatusValue.HIGH_RISK,
    };
    return mapping[enumValue];
  }
}
