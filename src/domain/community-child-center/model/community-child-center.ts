import { v4 as uuidv4 } from 'uuid';
import { DomainError, Result } from '@domain/common/result';
import { Address } from '@domain/common/value-objects/address.vo';
import { InstitutionName } from '@domain/common/value-objects/institution-name.vo';

/**
 * 지역아동센터 생성 Props
 */
export interface CreateCommunityChildCenterProps {
  /** 기관명 */
  name: InstitutionName;
  /** 주소 */
  address: Address;
  /** 센터장명 (대표자) */
  directorName: string;
  /** 기관 대표번호 (optional) */
  phoneNumber?: string;
  /** 정원 (optional) */
  capacity?: number;
  /** 설립일 (optional) */
  establishedDate?: Date;
  /** 기관 소개 */
  introduction?: string;
  /** 운영 시간 (예: "평일 14:00-19:00") */
  operatingHours?: string;
}

/**
 * 지역아동센터 복원 Props (DB에서 복원 시)
 */
export interface RestoreCommunityChildCenterProps extends CreateCommunityChildCenterProps {
  id: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 지역아동센터 (CommunityChildCenter) Aggregate Root
 * - 아동복지법에 따른 지역아동센터
 * - 지역아동센터 선생님이 소속되는 기관
 */
export class CommunityChildCenter {
  private constructor(
    private readonly _id: string,
    private _name: InstitutionName,
    private _address: Address,
    private _directorName: string,
    private _phoneNumber: string | null,
    private _capacity: number | null,
    private _establishedDate: Date | null,
    private _introduction: string | null,
    private _operatingHours: string | null,
    private _isActive: boolean,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  /**
   * 지역아동센터 생성 (정적 팩토리 메서드)
   */
  static create(props: CreateCommunityChildCenterProps): Result<CommunityChildCenter, DomainError> {
    // 센터장명 검증
    if (!props.directorName?.trim()) {
      return Result.fail(new DomainError('센터장명은 필수입니다'));
    }

    if (props.directorName.length > 50) {
      return Result.fail(new DomainError('센터장명은 최대 50자까지 가능합니다'));
    }

    // 연락처 검증 (optional)
    if (props.phoneNumber) {
      const phoneRegex = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;
      if (!phoneRegex.test(props.phoneNumber.replace(/-/g, ''))) {
        return Result.fail(new DomainError('올바른 연락처 형식이 아닙니다'));
      }
    }

    // 정원 검증 (optional)
    if (props.capacity !== undefined) {
      if (props.capacity < 1) {
        return Result.fail(new DomainError('정원은 1명 이상이어야 합니다'));
      }

      if (props.capacity > 300) {
        return Result.fail(new DomainError('정원은 최대 300명까지 가능합니다'));
      }
    }

    // 설립일 검증 (optional)
    if (props.establishedDate && props.establishedDate > new Date()) {
      return Result.fail(new DomainError('설립일은 미래 날짜일 수 없습니다'));
    }

    // 소개글 검증
    if (props.introduction && props.introduction.length > 500) {
      return Result.fail(new DomainError('기관 소개는 최대 500자까지 가능합니다'));
    }

    // 운영 시간 검증
    if (props.operatingHours && props.operatingHours.length > 100) {
      return Result.fail(new DomainError('운영 시간은 최대 100자까지 가능합니다'));
    }

    const now = new Date();
    return Result.ok(
      new CommunityChildCenter(
        uuidv4(),
        props.name,
        props.address,
        props.directorName.trim(),
        props.phoneNumber?.trim() || null,
        props.capacity ?? null,
        props.establishedDate ?? null,
        props.introduction?.trim() || null,
        props.operatingHours?.trim() || null,
        true, // isActive
        now,
        now,
      ),
    );
  }

  /**
   * DB에서 복원
   */
  static restore(props: RestoreCommunityChildCenterProps): CommunityChildCenter {
    return new CommunityChildCenter(
      props.id,
      props.name,
      props.address,
      props.directorName,
      props.phoneNumber ?? null,
      props.capacity ?? null,
      props.establishedDate ?? null,
      props.introduction || null,
      props.operatingHours || null,
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

  get directorName(): string {
    return this._directorName;
  }

  get phoneNumber(): string | null {
    return this._phoneNumber;
  }

  get capacity(): number | null {
    return this._capacity;
  }

  get establishedDate(): Date | null {
    return this._establishedDate;
  }

  get introduction(): string | null {
    return this._introduction;
  }

  get operatingHours(): string | null {
    return this._operatingHours;
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
   * 기관명 변경
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
   * 센터장 정보 변경
   */
  changeDirector(name: string, phoneNumber?: string): Result<void, DomainError> {
    if (!name?.trim()) {
      return Result.fail(new DomainError('센터장명은 필수입니다'));
    }

    if (name.length > 50) {
      return Result.fail(new DomainError('센터장명은 최대 50자까지 가능합니다'));
    }

    if (phoneNumber) {
      const phoneRegex = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;
      if (!phoneRegex.test(phoneNumber.replace(/-/g, ''))) {
        return Result.fail(new DomainError('올바른 연락처 형식이 아닙니다'));
      }
    }

    this._directorName = name.trim();
    this._phoneNumber = phoneNumber?.trim() || null;
    this._updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * 정원 변경
   */
  changeCapacity(capacity: number): Result<void, DomainError> {
    if (capacity < 1) {
      return Result.fail(new DomainError('정원은 1명 이상이어야 합니다'));
    }

    if (capacity > 300) {
      return Result.fail(new DomainError('정원은 최대 300명까지 가능합니다'));
    }

    this._capacity = capacity;
    this._updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * 기관 소개 변경
   */
  changeIntroduction(introduction: string | null): Result<void, DomainError> {
    if (introduction && introduction.length > 500) {
      return Result.fail(new DomainError('기관 소개는 최대 500자까지 가능합니다'));
    }

    this._introduction = introduction?.trim() || null;
    this._updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * 운영 시간 변경
   */
  changeOperatingHours(operatingHours: string | null): Result<void, DomainError> {
    if (operatingHours && operatingHours.length > 100) {
      return Result.fail(new DomainError('운영 시간은 최대 100자까지 가능합니다'));
    }

    this._operatingHours = operatingHours?.trim() || null;
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
