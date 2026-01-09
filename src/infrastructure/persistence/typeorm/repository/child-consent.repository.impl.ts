import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChildConsent } from '@domain/consent/model/child-consent';
import {
  ChildConsentRepository,
  ConsentHistoryData,
} from '@domain/consent/repository/child-consent.repository';
import { ChildConsentEntity } from '../entity/child-consent.entity';
import { ConsentHistoryEntity } from '../entity/consent-history.entity';
import { ConsentAction } from '../entity/enums/consent-action.enum';
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
    const entity = await this.consentRepository.findOne({
      where: { childId },
    });

    if (!entity) {
      return null;
    }

    return ChildConsentMapper.toDomain(entity);
  }

  async hasValidConsent(childId: string): Promise<boolean> {
    const entity = await this.consentRepository.findOne({
      where: { childId },
    });

    if (!entity) {
      return false;
    }

    // 철회되지 않고 필수 항목이 동의된 상태인지 확인
    const isNotRevoked = entity.revokedAt === null;
    const hasRequiredConsents =
      entity.consentItems.personalInfo && entity.consentItems.sensitiveData;

    return isNotRevoked && hasRequiredConsents;
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
