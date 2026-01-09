import { DomainError, Result } from '@domain/common/result';

/**
 * 동의 항목 타입
 */
export interface ConsentItemsValue {
  /** (필수) 개인정보 수집·이용 및 제3자 제공 동의 */
  personalInfo: boolean;
  /** (필수) 민감정보 처리 동의 */
  sensitiveData: boolean;
  /** (선택) 비식별화 데이터 연구 활용 동의 */
  researchData: boolean;
  /** (14세 이상 필수) 아동 본인 동의 */
  childSelfConsent: boolean;
}

/**
 * 동의 항목 Value Object
 *
 * 비즈니스 규칙:
 * - personalInfo와 sensitiveData는 필수 (true여야 함)
 * - researchData는 선택
 * - 14세 이상 아동의 경우 childSelfConsent도 필수
 */
export class ConsentItems {
  private constructor(private readonly _value: ConsentItemsValue) {}

  /**
   * 동의 항목 생성 (필수 항목 검증 포함)
   *
   * @param items 동의 항목
   * @param isChildOver14 아동이 14세 이상인지 여부
   */
  public static create(
    items: ConsentItemsValue,
    isChildOver14: boolean = false,
  ): Result<ConsentItems, DomainError> {
    // 필수 항목 검증: 개인정보 수집 동의
    if (!items.personalInfo) {
      return Result.fail(
        new DomainError(
          '개인정보 수집·이용 및 제3자 제공 동의는 필수입니다.',
          'PERSONAL_INFO_CONSENT_REQUIRED',
        ),
      );
    }

    // 필수 항목 검증: 민감정보 처리 동의
    if (!items.sensitiveData) {
      return Result.fail(
        new DomainError('민감정보 처리 동의는 필수입니다.', 'SENSITIVE_DATA_CONSENT_REQUIRED'),
      );
    }

    // 14세 이상 아동의 경우 본인 동의 필수
    if (isChildOver14 && !items.childSelfConsent) {
      return Result.fail(
        new DomainError(
          '만 14세 이상 아동은 본인 동의가 필수입니다.',
          'CHILD_SELF_CONSENT_REQUIRED',
        ),
      );
    }

    return Result.ok(new ConsentItems(items));
  }

  /**
   * DB 복원용 (검증 생략)
   */
  public static restore(items: ConsentItemsValue): ConsentItems {
    return new ConsentItems(items);
  }

  get value(): ConsentItemsValue {
    return { ...this._value };
  }

  get personalInfo(): boolean {
    return this._value.personalInfo;
  }

  get sensitiveData(): boolean {
    return this._value.sensitiveData;
  }

  get researchData(): boolean {
    return this._value.researchData;
  }

  get childSelfConsent(): boolean {
    return this._value.childSelfConsent;
  }

  /**
   * 필수 항목이 모두 동의되었는지 확인
   */
  public hasRequiredConsents(): boolean {
    return this._value.personalInfo && this._value.sensitiveData;
  }

  /**
   * 동등성 비교
   */
  public equals(other: ConsentItems): boolean {
    return (
      this._value.personalInfo === other._value.personalInfo &&
      this._value.sensitiveData === other._value.sensitiveData &&
      this._value.researchData === other._value.researchData &&
      this._value.childSelfConsent === other._value.childSelfConsent
    );
  }
}
