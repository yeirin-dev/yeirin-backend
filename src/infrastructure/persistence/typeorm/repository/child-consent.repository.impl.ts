import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChildConsent } from '@domain/consent/model/child-consent';
import { ConsentRole } from '@domain/consent/model/value-objects/consent-role';
import {
  ChildConsentRepository,
  CompleteConsentStatus,
  ConsentHistoryData,
} from '@domain/consent/repository/child-consent.repository';
import { ChildConsentEntity } from '../entity/child-consent.entity';
import { ConsentHistoryEntity } from '../entity/consent-history.entity';
import { ConsentAction } from '../entity/enums/consent-action.enum';
import { ConsentRole as EntityConsentRole } from '../entity/enums/consent-role.enum';
import { ChildConsentMapper } from '../mapper/child-consent.mapper';

/**
 * ChildConsent Repository 구현체
 * TypeORM 사용
 */
@Injectable()
export class ChildConsentRepositoryImpl implements ChildConsentRepository {
  constructor(
    @InjectRepository(ChildConsentEntity)
    private readonly consentRepository: Repository<ChildConsentEntity>,
    @InjectRepository(ConsentHistoryEntity)
    private readonly historyRepository: Repository<ConsentHistoryEntity>,
  ) {}

  async save(consent: ChildConsent): Promise<ChildConsent> {
    const entity = ChildConsentMapper.toEntity(consent);
    const savedEntity = await this.consentRepository.save(entity);
    return ChildConsentMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<ChildConsent | null> {
    const entity = await this.consentRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return ChildConsentMapper.toDomain(entity);
  }

  async findByChildId(childId: string): Promise<ChildConsent | null> {
    // 기존 호환성: CHILD role 우선, 없으면 GUARDIAN
    const entity = await this.consentRepository.findOne({
      where: { childId, role: EntityConsentRole.CHILD },
    });

    if (entity) {
      return ChildConsentMapper.toDomain(entity);
    }

    // CHILD 없으면 GUARDIAN 조회 (기존 데이터 호환)
    const guardianEntity = await this.consentRepository.findOne({
      where: { childId, role: EntityConsentRole.GUARDIAN },
    });

    if (!guardianEntity) {
      return null;
    }

    return ChildConsentMapper.toDomain(guardianEntity);
  }

  async findByChildIdAndRole(
    childId: string,
    role: ConsentRole,
  ): Promise<ChildConsent | null> {
    const entityRole =
      role === ConsentRole.GUARDIAN ? EntityConsentRole.GUARDIAN : EntityConsentRole.CHILD;

    const entity = await this.consentRepository.findOne({
      where: { childId, role: entityRole },
    });

    if (!entity) {
      return null;
    }

    return ChildConsentMapper.toDomain(entity);
  }

  async findAllByChildId(childId: string): Promise<ChildConsent[]> {
    const entities = await this.consentRepository.find({
      where: { childId },
    });

    return entities.map((entity) => ChildConsentMapper.toDomain(entity));
  }

  async hasValidConsent(childId: string): Promise<boolean> {
    // 기존 호환성: 아무 유효한 동의가 있으면 true
    const entities = await this.consentRepository.find({
      where: { childId },
    });

    return entities.some((entity) => {
      const isNotRevoked = entity.revokedAt === null;
      const hasRequiredConsents =
        entity.consentItems.personalInfo && entity.consentItems.sensitiveData;
      return isNotRevoked && hasRequiredConsents;
    });
  }

  async hasValidConsentByRole(childId: string, role: ConsentRole): Promise<boolean> {
    const entityRole =
      role === ConsentRole.GUARDIAN ? EntityConsentRole.GUARDIAN : EntityConsentRole.CHILD;

    const entity = await this.consentRepository.findOne({
      where: { childId, role: entityRole },
    });

    if (!entity) {
      return false;
    }

    const isNotRevoked = entity.revokedAt === null;
    const hasRequiredConsents =
      entity.consentItems.personalInfo && entity.consentItems.sensitiveData;

    return isNotRevoked && hasRequiredConsents;
  }

  async getCompleteConsentStatus(
    childId: string,
    isOver14: boolean,
  ): Promise<CompleteConsentStatus> {
    const hasGuardianConsent = await this.hasValidConsentByRole(childId, ConsentRole.GUARDIAN);
    const hasChildConsent = await this.hasValidConsentByRole(childId, ConsentRole.CHILD);

    if (isOver14) {
      // 14세 이상: 보호자 + 아동 본인 동의 모두 필요
      const isComplete = hasGuardianConsent && hasChildConsent;
      let requiredConsent: 'GUARDIAN' | 'CHILD' | 'BOTH' | null = null;

      if (!hasGuardianConsent && !hasChildConsent) {
        requiredConsent = 'BOTH';
      } else if (!hasGuardianConsent) {
        requiredConsent = 'GUARDIAN';
      } else if (!hasChildConsent) {
        requiredConsent = 'CHILD';
      }

      return {
        isComplete,
        hasGuardianConsent,
        hasChildConsent,
        requiredConsent,
      };
    } else {
      // 14세 미만: 보호자 동의만 필요
      return {
        isComplete: hasGuardianConsent,
        hasGuardianConsent,
        hasChildConsent,
        requiredConsent: hasGuardianConsent ? null : 'GUARDIAN',
      };
    }
  }

  async delete(id: string): Promise<void> {
    await this.consentRepository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.consentRepository.count({
      where: { id },
    });

    return count > 0;
  }

  async saveHistory(history: ConsentHistoryData): Promise<void> {
    const entity = new ConsentHistoryEntity();
    entity.consentId = history.consentId;
    entity.childId = history.childId;
    entity.action = history.action as ConsentAction;
    entity.previousData = history.previousData;
    entity.newData = history.newData;
    entity.ipAddress = history.ipAddress;

    await this.historyRepository.save(entity);
  }

  async findHistoryByChildId(
    childId: string,
  ): Promise<{ action: string; createdAt: Date; ipAddress: string | null }[]> {
    const entities = await this.historyRepository.find({
      where: { childId },
      order: { createdAt: 'DESC' },
      select: ['action', 'createdAt', 'ipAddress'],
    });

    return entities.map((entity) => ({
      action: entity.action,
      createdAt: entity.createdAt,
      ipAddress: entity.ipAddress,
    }));
  }
}
