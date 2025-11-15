import { v4 as uuidv4 } from 'uuid';
import { Result, DomainError } from '@domain/common/result';
import { AggregateRoot } from '@domain/common/domain-event';
import { ChildName } from './value-objects/child-name.vo';
import { BirthDate } from './value-objects/birth-date.vo';
import { Gender } from './value-objects/gender.vo';

/**
 * Child 생성 Props
 */
export interface ChildProps {
  name: ChildName;
  birthDate: BirthDate;
  gender: Gender;
  guardianId: string | null; // 보호자 ID (부모 또는 양육시설 교사)
  institutionId: string | null; // 양육시설 ID (고아인 경우)
  medicalInfo?: string; // 의료 정보 (선택)
  specialNeeds?: string; // 특수 요구사항 (선택)
}

/**
 * Child Aggregate Root
 * 비즈니스 규칙:
 * 1. 아동은 직접 회원가입 불가 (Guardian이 등록)
 * 2. 보호자(Guardian) 또는 양육시설(Institution) 중 하나와 반드시 연결
 * 3. 고아: institutionId 있고 guardianId null
 * 4. 일반 아동: guardianId 있고 institutionId null
 */
export class Child extends AggregateRoot {
  private readonly _id: string;
  private readonly _name: ChildName;
  private readonly _birthDate: BirthDate;
  private readonly _gender: Gender;

  // 보호자 관계 (하나만 존재)
  private _guardianId: string | null;
  private _institutionId: string | null;

  // 의료/심리 정보 (민감 정보)
  private _medicalInfo: string | null;
  private _specialNeeds: string | null;

  // 타임스탬프
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: ChildProps, id?: string, createdAt?: Date) {
    super();
    this._id = id ?? uuidv4();
    this._name = props.name;
    this._birthDate = props.birthDate;
    this._gender = props.gender;
    this._guardianId = props.guardianId;
    this._institutionId = props.institutionId;
    this._medicalInfo = props.medicalInfo ?? null;
    this._specialNeeds = props.specialNeeds ?? null;
    this._createdAt = createdAt ?? new Date();
    this._updatedAt = new Date();
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get name(): ChildName {
    return this._name;
  }

  get birthDate(): BirthDate {
    return this._birthDate;
  }

  get gender(): Gender {
    return this._gender;
  }

  get guardianId(): string | null {
    return this._guardianId;
  }

  get institutionId(): string | null {
    return this._institutionId;
  }

  get medicalInfo(): string | null {
    return this._medicalInfo;
  }

  get specialNeeds(): string | null {
    return this._specialNeeds;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * 고아 여부 확인
   */
  get isOrphan(): boolean {
    return this._institutionId !== null && this._guardianId === null;
  }

  /**
   * 아동 생성 (정적 팩토리 메서드)
   * 비즈니스 규칙 검증:
   * - guardianId와 institutionId 중 정확히 하나만 존재해야 함
   */
  public static create(
    props: ChildProps,
    id?: string,
    createdAt?: Date,
  ): Result<Child, DomainError> {
    // 비즈니스 규칙: 보호자 또는 양육시설 중 하나는 반드시 존재
    const hasGuardian = props.guardianId !== null;
    const hasInstitution = props.institutionId !== null;

    if (!hasGuardian && !hasInstitution) {
      return Result.fail(new DomainError('아동은 보호자 또는 양육시설과 연결되어야 합니다'));
    }

    // 비즈니스 규칙: 둘 다 존재하면 안 됨
    if (hasGuardian && hasInstitution) {
      return Result.fail(
        new DomainError('아동은 보호자 또는 양육시설 중 하나만 연결되어야 합니다'),
      );
    }

    return Result.ok(new Child(props, id, createdAt));
  }

  /**
   * DB 복원용 (검증 생략)
   */
  public static restore(props: ChildProps, id: string, createdAt: Date): Child {
    return new Child(props, id, createdAt);
  }

  /**
   * 나이 조회
   */
  public getAge(): number {
    return this._birthDate.getAge();
  }

  /**
   * 보호자 변경 (예: 양육시설 → 입양)
   */
  public changeGuardian(newGuardianId: string): Result<void, DomainError> {
    if (!newGuardianId) {
      return Result.fail(new DomainError('새로운 보호자 ID는 필수입니다'));
    }

    this._guardianId = newGuardianId;
    this._institutionId = null; // 양육시설 연결 해제
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * 의료 정보 업데이트
   */
  public updateMedicalInfo(medicalInfo: string): void {
    this._medicalInfo = medicalInfo;
    this._updatedAt = new Date();
  }

  /**
   * 특수 요구사항 업데이트
   */
  public updateSpecialNeeds(specialNeeds: string): void {
    this._specialNeeds = specialNeeds;
    this._updatedAt = new Date();
  }
}
