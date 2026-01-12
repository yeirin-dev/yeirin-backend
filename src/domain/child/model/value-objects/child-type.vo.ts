import { DomainError, Result } from '@domain/common/result';

/**
 * 아동 유형 enum
 * - CARE_FACILITY: 양육시설 아동 (고아)
 * - COMMUNITY_CENTER: 지역아동센터 아동 (비고아, 부모+센터)
 * - EDUCATION_WELFARE_SCHOOL: 교육복지사협회 학교 아동
 * - REGULAR: 일반 아동 (부모 직접보호)
 */
export enum ChildTypeValue {
  /** 양육시설 아동 (고아) - 양육시설만 연결 */
  CARE_FACILITY = 'CARE_FACILITY',

  /** 지역아동센터 아동 (비고아) - 지역아동센터 + 부모 연결 */
  COMMUNITY_CENTER = 'COMMUNITY_CENTER',

  /** 교육복지사협회 학교 아동 - 학교 + 부모 연결 */
  EDUCATION_WELFARE_SCHOOL = 'EDUCATION_WELFARE_SCHOOL',

  /** 일반 아동 - 부모만 연결 (직접보호) */
  REGULAR = 'REGULAR',
}

/**
 * 아동 유형 Value Object
 *
 * 유형별 관계 규칙:
 * - CARE_FACILITY: careFacilityId 필수, guardianId null
 * - COMMUNITY_CENTER: communityChildCenterId 필수, guardianId 필수
 * - EDUCATION_WELFARE_SCHOOL: educationWelfareSchoolId 필수, guardianId 필수
 * - REGULAR: guardianId 필수, 기관 연결 없음
 */
export class ChildType {
  private readonly _value: ChildTypeValue;

  private constructor(value: ChildTypeValue) {
    this._value = value;
  }

  get value(): ChildTypeValue {
    return this._value;
  }

  /**
   * 고아 여부 확인 (양육시설 아동)
   */
  get isOrphan(): boolean {
    return this._value === ChildTypeValue.CARE_FACILITY;
  }

  /**
   * 기관 소속 필요 여부
   */
  get requiresInstitution(): boolean {
    return (
      this._value === ChildTypeValue.CARE_FACILITY ||
      this._value === ChildTypeValue.COMMUNITY_CENTER ||
      this._value === ChildTypeValue.EDUCATION_WELFARE_SCHOOL
    );
  }

  /**
   * 부모(보호자) 연결 필요 여부
   */
  get requiresGuardian(): boolean {
    return (
      this._value === ChildTypeValue.COMMUNITY_CENTER ||
      this._value === ChildTypeValue.EDUCATION_WELFARE_SCHOOL ||
      this._value === ChildTypeValue.REGULAR
    );
  }

  /**
   * 양육시설 연결 필요 여부
   */
  get requiresCareFacility(): boolean {
    return this._value === ChildTypeValue.CARE_FACILITY;
  }

  /**
   * 지역아동센터 연결 필요 여부
   */
  get requiresCommunityChildCenter(): boolean {
    return this._value === ChildTypeValue.COMMUNITY_CENTER;
  }

  /**
   * 교육복지사협회 학교 연결 필요 여부
   */
  get requiresEducationWelfareSchool(): boolean {
    return this._value === ChildTypeValue.EDUCATION_WELFARE_SCHOOL;
  }

  /**
   * 아동 유형 생성
   */
  public static create(type: ChildTypeValue): Result<ChildType, DomainError> {
    if (!type) {
      return Result.fail(new DomainError('아동 유형은 필수입니다'));
    }

    if (!Object.values(ChildTypeValue).includes(type)) {
      return Result.fail(new DomainError('유효하지 않은 아동 유형입니다'));
    }

    return Result.ok(new ChildType(type));
  }

  /**
   * Value Object 동등성 비교
   */
  public equals(other: ChildType): boolean {
    if (!other) {
      return false;
    }
    return this._value === other._value;
  }
}
