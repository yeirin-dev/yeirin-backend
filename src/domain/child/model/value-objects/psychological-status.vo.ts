import { DomainError, Result } from '@domain/common/result';

/**
 * 아동 심리 상태 enum
 * - NORMAL: 일반 (정상 상태)
 * - AT_RISK: 위험 (관심 필요)
 * - HIGH_RISK: 고위험 (즉시 개입 필요)
 */
export enum PsychologicalStatusValue {
  /** 일반 상태 - 정상적인 대화 패턴 */
  NORMAL = 'NORMAL',

  /** 위험 상태 - 심리적 불안정 징후 감지 */
  AT_RISK = 'AT_RISK',

  /** 고위험 상태 - 즉각적인 전문 상담 필요 */
  HIGH_RISK = 'HIGH_RISK',
}

/**
 * 심리 상태별 우선순위 (숫자가 높을수록 심각)
 */
const PRIORITY_MAP: Record<PsychologicalStatusValue, number> = {
  [PsychologicalStatusValue.NORMAL]: 0,
  [PsychologicalStatusValue.AT_RISK]: 1,
  [PsychologicalStatusValue.HIGH_RISK]: 2,
};

/**
 * 아동 심리 상태 Value Object
 *
 * Soul-E 챗봇에서 대화 중 위험 징후를 감지하면 상태를 업데이트합니다.
 * 상태 변경은 항상 로그로 기록됩니다.
 */
export class PsychologicalStatus {
  private readonly _value: PsychologicalStatusValue;

  private constructor(value: PsychologicalStatusValue) {
    this._value = value;
  }

  get value(): PsychologicalStatusValue {
    return this._value;
  }

  /**
   * 심리 상태 우선순위 (숫자가 높을수록 심각)
   */
  get priority(): number {
    return PRIORITY_MAP[this._value];
  }

  /**
   * 위험 상태 이상인지 확인
   */
  get isAtRiskOrHigher(): boolean {
    return this.priority >= PRIORITY_MAP[PsychologicalStatusValue.AT_RISK];
  }

  /**
   * 고위험 상태인지 확인
   */
  get isHighRisk(): boolean {
    return this._value === PsychologicalStatusValue.HIGH_RISK;
  }

  /**
   * 일반 상태인지 확인
   */
  get isNormal(): boolean {
    return this._value === PsychologicalStatusValue.NORMAL;
  }

  /**
   * 한글 레이블 반환
   */
  get label(): string {
    switch (this._value) {
      case PsychologicalStatusValue.NORMAL:
        return '일반';
      case PsychologicalStatusValue.AT_RISK:
        return '위험';
      case PsychologicalStatusValue.HIGH_RISK:
        return '고위험';
    }
  }

  /**
   * 심리 상태 생성
   */
  public static create(status: PsychologicalStatusValue): Result<PsychologicalStatus, DomainError> {
    if (!status) {
      return Result.fail(new DomainError('심리 상태는 필수입니다'));
    }

    if (!Object.values(PsychologicalStatusValue).includes(status)) {
      return Result.fail(new DomainError('유효하지 않은 심리 상태입니다'));
    }

    return Result.ok(new PsychologicalStatus(status));
  }

  /**
   * 기본 상태(NORMAL) 생성
   */
  public static createDefault(): PsychologicalStatus {
    return new PsychologicalStatus(PsychologicalStatusValue.NORMAL);
  }

  /**
   * 상태 변경 시 상승인지 확인
   * (NORMAL → AT_RISK, AT_RISK → HIGH_RISK 등)
   */
  public isEscalationTo(other: PsychologicalStatus): boolean {
    return other.priority > this.priority;
  }

  /**
   * 상태 변경 시 하락인지 확인
   * (HIGH_RISK → AT_RISK, AT_RISK → NORMAL 등)
   */
  public isDeescalationTo(other: PsychologicalStatus): boolean {
    return other.priority < this.priority;
  }

  /**
   * Value Object 동등성 비교
   */
  public equals(other: PsychologicalStatus): boolean {
    if (!other) {
      return false;
    }
    return this._value === other._value;
  }
}
