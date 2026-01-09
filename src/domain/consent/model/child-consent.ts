import { DomainError, Result } from '@domain/common/result';
import { ConsentItems, ConsentItemsValue } from './value-objects/consent-items.vo';
import { ConsentVersion } from './value-objects/consent-version.vo';

/**
 * ChildConsent 생성 Props
 */
export interface ChildConsentProps {
  childId: string;
  consentItems: ConsentItems;
  consentVersion: ConsentVersion;
  documentUrl: string | null;
  consentedAt: Date;
  revokedAt: Date | null;
  revocationReason: string | null;
  ipAddress: string | null;
}

export interface FullChildConsentProps extends ChildConsentProps {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateChildConsentProps = {
  childId: string;
  consentItems: ConsentItemsValue;
  isChildOver14: boolean;
  documentUrl?: string;
  ipAddress?: string;
};

/**
 * ChildConsent Aggregate Root
 *
 * Soul-E 서비스 이용을 위한 개인정보 처리 동의
 *
 * 비즈니스 규칙:
 * - 아동당 하나의 유효한 동의만 존재
 * - 필수 항목(personalInfo, sensitiveData) 동의 필수
 * - 14세 이상 아동은 본인 동의(childSelfConsent) 필수
 * - 동의 철회 시 revokedAt 기록, 사유 필수
 */
export class ChildConsent {
  private readonly _id: string;
  private readonly _childId: string;
  private _consentItems: ConsentItems;
  private _consentVersion: ConsentVersion;
  private _documentUrl: string | null;
  private _consentedAt: Date;
  private _revokedAt: Date | null;
  private _revocationReason: string | null;
  private _ipAddress: string | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: FullChildConsentProps) {
    this._id = props.id;
    this._childId = props.childId;
    this._consentItems = props.consentItems;
    this._consentVersion = props.consentVersion;
    this._documentUrl = props.documentUrl;
    this._consentedAt = props.consentedAt;
    this._revokedAt = props.revokedAt;
    this._revocationReason = props.revocationReason;
    this._ipAddress = props.ipAddress;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // ==================== Getters ====================

  get id(): string {
    return this._id;
  }

  get childId(): string {
    return this._childId;
  }

  get consentItems(): ConsentItems {
    return this._consentItems;
  }

  get consentVersion(): ConsentVersion {
    return this._consentVersion;
  }

  get documentUrl(): string | null {
    return this._documentUrl;
  }

  get consentedAt(): Date {
    return this._consentedAt;
  }

  get revokedAt(): Date | null {
    return this._revokedAt;
  }

  get revocationReason(): string | null {
    return this._revocationReason;
  }

  get ipAddress(): string | null {
    return this._ipAddress;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ==================== Static Factory Methods ====================

  /**
   * 새로운 동의 생성
   */
  public static create(
    props: CreateChildConsentProps,
    id?: string,
  ): Result<ChildConsent, DomainError> {
    // 동의 항목 검증
    const consentItemsResult = ConsentItems.create(props.consentItems, props.isChildOver14);
    if (consentItemsResult.isFailure) {
      return Result.fail(consentItemsResult.getError());
    }

    const now = new Date();
    const consent = new ChildConsent({
      id: id || crypto.randomUUID(),
      childId: props.childId,
      consentItems: consentItemsResult.getValue(),
      consentVersion: ConsentVersion.createCurrent(),
      documentUrl: props.documentUrl ?? null,
      consentedAt: now,
      revokedAt: null,
      revocationReason: null,
      ipAddress: props.ipAddress ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return Result.ok(consent);
  }

  /**
   * DB에서 복원 (모든 필드 포함)
   */
  public static restore(props: FullChildConsentProps): ChildConsent {
    return new ChildConsent(props);
  }

  // ==================== Business Logic ====================

  /**
   * 유효한 동의인지 확인
   * - 철회되지 않았고
   * - 필수 항목이 모두 동의됨
   */
  public isValid(): boolean {
    return this._revokedAt === null && this._consentItems.hasRequiredConsents();
  }

  /**
   * 동의 철회
   */
  public revoke(reason: string): Result<void, DomainError> {
    if (this._revokedAt !== null) {
      return Result.fail(new DomainError('이미 철회된 동의입니다.', 'ALREADY_REVOKED'));
    }

    if (!reason || !reason.trim()) {
      return Result.fail(new DomainError('철회 사유는 필수입니다.', 'REVOCATION_REASON_REQUIRED'));
    }

    this._revokedAt = new Date();
    this._revocationReason = reason.trim();
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * 동의 항목 업데이트 (재동의)
   */
  public updateConsent(
    items: ConsentItemsValue,
    isChildOver14: boolean,
    ipAddress?: string,
  ): Result<void, DomainError> {
    const consentItemsResult = ConsentItems.create(items, isChildOver14);
    if (consentItemsResult.isFailure) {
      return Result.fail(consentItemsResult.getError());
    }

    this._consentItems = consentItemsResult.getValue();
    this._consentVersion = ConsentVersion.createCurrent();
    this._consentedAt = new Date();
    this._revokedAt = null;
    this._revocationReason = null;
    this._ipAddress = ipAddress ?? null;
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * 현재 버전의 동의인지 확인
   */
  public isCurrentVersion(): boolean {
    return this._consentVersion.isCurrent();
  }
}
