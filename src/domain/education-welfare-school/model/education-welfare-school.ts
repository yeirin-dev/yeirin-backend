import { v4 as uuidv4 } from 'uuid';
import { DomainError, Result } from '@domain/common/result';
import { Address } from '@domain/common/value-objects/address.vo';
import { InstitutionName } from '@domain/common/value-objects/institution-name.vo';

/**
 * 교육복지사협회 학교 생성 Props
 */
export interface CreateEducationWelfareSchoolProps {
  /** 학교명 */
  name: InstitutionName;
  /** 주소 */
  address: Address;
  /** 교육복지사 성명 */
  welfareWorkerName: string;
  /** 교육복지사 연락처 */
  welfareWorkerPhone: string;
  /** 학교 교육복지실 연락처 (optional) */
  phoneNumber?: string;
  /** 이메일 (optional) */
  email?: string;
  /** 바우처 예상 아동 수 (optional) */
  expectedChildCount?: number;
  /** 연계희망센터명 (optional) */
  linkedCenterName?: string;
  /** 연계희망센터 주소 (optional) */
  linkedCenterAddress?: string;
}

/**
 * 교육복지사협회 학교 복원 Props (DB에서 복원 시)
 */
export interface RestoreEducationWelfareSchoolProps extends CreateEducationWelfareSchoolProps {
  id: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 교육복지사협회 학교 (EducationWelfareSchool) Aggregate Root
 * - 교육복지사가 배치된 학교
 * - 교육복지사가 관리하는 아동이 소속되는 기관
 */
export class EducationWelfareSchool {
  private constructor(
    private readonly _id: string,
    private _name: InstitutionName,
    private _address: Address,
    private _welfareWorkerName: string,
    private _welfareWorkerPhone: string,
    private _phoneNumber: string | null,
    private _email: string | null,
    private _expectedChildCount: number | null,
    private _linkedCenterName: string | null,
    private _linkedCenterAddress: string | null,
    private _isActive: boolean,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  /**
   * 교육복지사협회 학교 생성 (정적 팩토리 메서드)
   */
  static create(
    props: CreateEducationWelfareSchoolProps,
  ): Result<EducationWelfareSchool, DomainError> {
    // 교육복지사 성명 검증
    if (!props.welfareWorkerName?.trim()) {
      return Result.fail(new DomainError('교육복지사 성명은 필수입니다'));
    }

    if (props.welfareWorkerName.length > 50) {
      return Result.fail(new DomainError('교육복지사 성명은 최대 50자까지 가능합니다'));
    }

    // 교육복지사 연락처 검증
    if (!props.welfareWorkerPhone?.trim()) {
      return Result.fail(new DomainError('교육복지사 연락처는 필수입니다'));
    }

    const phoneRegex = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;
    if (!phoneRegex.test(props.welfareWorkerPhone.replace(/-/g, ''))) {
      return Result.fail(new DomainError('올바른 연락처 형식이 아닙니다'));
    }

    // 학교 연락처 검증 (optional)
    if (props.phoneNumber) {
      if (!phoneRegex.test(props.phoneNumber.replace(/-/g, ''))) {
        return Result.fail(new DomainError('올바른 학교 연락처 형식이 아닙니다'));
      }
    }

    // 이메일 검증 (optional)
    if (props.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(props.email)) {
        return Result.fail(new DomainError('올바른 이메일 형식이 아닙니다'));
      }
    }

    // 바우처 예상 아동 수 검증 (optional)
    if (props.expectedChildCount !== undefined) {
      if (props.expectedChildCount < 1) {
        return Result.fail(new DomainError('바우처 예상 아동 수는 1명 이상이어야 합니다'));
      }
    }

    const now = new Date();
    return Result.ok(
      new EducationWelfareSchool(
        uuidv4(),
        props.name,
        props.address,
        props.welfareWorkerName.trim(),
        props.welfareWorkerPhone.trim(),
        props.phoneNumber?.trim() || null,
        props.email?.trim() || null,
        props.expectedChildCount ?? null,
        props.linkedCenterName?.trim() || null,
        props.linkedCenterAddress?.trim() || null,
        true, // isActive
        now,
        now,
      ),
    );
  }

  /**
   * DB에서 복원
   */
  static restore(props: RestoreEducationWelfareSchoolProps): EducationWelfareSchool {
    return new EducationWelfareSchool(
      props.id,
      props.name,
      props.address,
      props.welfareWorkerName,
      props.welfareWorkerPhone,
      props.phoneNumber ?? null,
      props.email ?? null,
      props.expectedChildCount ?? null,
      props.linkedCenterName || null,
      props.linkedCenterAddress || null,
      props.isActive,
      props.createdAt,
      props.updatedAt,
    );
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get name(): InstitutionName {
    return this._name;
  }

  get address(): Address {
    return this._address;
  }

  get welfareWorkerName(): string {
    return this._welfareWorkerName;
  }

  get welfareWorkerPhone(): string {
    return this._welfareWorkerPhone;
  }

  get phoneNumber(): string | null {
    return this._phoneNumber;
  }

  get email(): string | null {
    return this._email;
  }

  get expectedChildCount(): number | null {
    return this._expectedChildCount;
  }

  get linkedCenterName(): string | null {
    return this._linkedCenterName;
  }

  get linkedCenterAddress(): string | null {
    return this._linkedCenterAddress;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // 비즈니스 메서드

  /**
   * 학교명 변경
   */
  changeName(name: InstitutionName): void {
    this._name = name;
    this._updatedAt = new Date();
  }

  /**
   * 주소 변경
   */
  changeAddress(address: Address): void {
    this._address = address;
    this._updatedAt = new Date();
  }

  /**
   * 교육복지사 정보 변경
   */
  changeWelfareWorker(
    name: string,
    phone: string,
  ): Result<void, DomainError> {
    if (!name?.trim()) {
      return Result.fail(new DomainError('교육복지사 성명은 필수입니다'));
    }

    if (name.length > 50) {
      return Result.fail(new DomainError('교육복지사 성명은 최대 50자까지 가능합니다'));
    }

    const phoneRegex = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;
    if (!phoneRegex.test(phone.replace(/-/g, ''))) {
      return Result.fail(new DomainError('올바른 연락처 형식이 아닙니다'));
    }

    this._welfareWorkerName = name.trim();
    this._welfareWorkerPhone = phone.trim();
    this._updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * 기관 활성화
   */
  activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * 기관 비활성화
   */
  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }
}
