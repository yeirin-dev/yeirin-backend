import { v4 as uuidv4 } from 'uuid';
import { AggregateRoot } from '@domain/common/domain-event';
import { DomainError, Result } from '@domain/common/result';
import { BirthDate } from './value-objects/birth-date.vo';
import { ChildName } from './value-objects/child-name.vo';
import { ChildType, ChildTypeValue } from './value-objects/child-type.vo';
import { Gender } from './value-objects/gender.vo';
import {
  PsychologicalStatus,
  PsychologicalStatusValue,
} from './value-objects/psychological-status.vo';

/**
 * Child 생성 Props
 */
export interface ChildProps {
  childType: ChildType;
  name: ChildName;
  birthDate: BirthDate;
  gender: Gender;
  // 기관 연결 (아동 유형에 따라 선택적)
  careFacilityId: string | null; // 양육시설 ID (CARE_FACILITY 유형)
  communityChildCenterId: string | null; // 지역아동센터 ID (COMMUNITY_CENTER 유형)
  // 부모(보호자) 연결 (COMMUNITY_CENTER, REGULAR 유형)
  guardianId: string | null; // 부모 보호자 ID
  // 추가 정보
  medicalInfo?: string; // 의료 정보 (선택)
  specialNeeds?: string; // 특수 요구사항 (선택)
  // 심리 상태 (Soul-E 챗봇에서 감지)
  psychologicalStatus?: PsychologicalStatus; // 심리 상태 (기본값: NORMAL)
}

/**
 * Child Aggregate Root
 *
 * 아동 유형별 비즈니스 규칙:
 *
 * 1. CARE_FACILITY (양육시설 아동, 고아):
 *    - careFacilityId 필수
 *    - communityChildCenterId null
 *    - guardianId null
 *
 * 2. COMMUNITY_CENTER (지역아동센터 아동, 비고아):
 *    - careFacilityId null
 *    - communityChildCenterId 필수
 *    - guardianId 필수 (부모)
 *
 * 3. REGULAR (일반 아동, 부모 직접보호):
 *    - careFacilityId null
 *    - communityChildCenterId null
 *    - guardianId 필수 (부모)
 */
export class Child extends AggregateRoot {
  private readonly _id: string;
  private readonly _childType: ChildType;
  private readonly _name: ChildName;
  private readonly _birthDate: BirthDate;
  private readonly _gender: Gender;

  // 기관 연결 (아동 유형에 따라 선택적)
  private _careFacilityId: string | null;
  private _communityChildCenterId: string | null;

  // 부모(보호자) 연결
  private _guardianId: string | null;

  // 의료/심리 정보 (민감 정보)
  private _medicalInfo: string | null;
  private _specialNeeds: string | null;

  // 심리 상태 (Soul-E 챗봇에서 감지)
  private _psychologicalStatus: PsychologicalStatus;

  // 타임스탬프
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: ChildProps, id?: string, createdAt?: Date) {
    super();
    this._id = id ?? uuidv4();
    this._childType = props.childType;
    this._name = props.name;
    this._birthDate = props.birthDate;
    this._gender = props.gender;
    this._careFacilityId = props.careFacilityId;
    this._communityChildCenterId = props.communityChildCenterId;
    this._guardianId = props.guardianId;
    this._medicalInfo = props.medicalInfo ?? null;
    this._specialNeeds = props.specialNeeds ?? null;
    this._psychologicalStatus = props.psychologicalStatus ?? PsychologicalStatus.createDefault();
    this._createdAt = createdAt ?? new Date();
    this._updatedAt = new Date();
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get childType(): ChildType {
    return this._childType;
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

  get careFacilityId(): string | null {
    return this._careFacilityId;
  }

  get communityChildCenterId(): string | null {
    return this._communityChildCenterId;
  }

  get guardianId(): string | null {
    return this._guardianId;
  }

  get medicalInfo(): string | null {
    return this._medicalInfo;
  }

  get specialNeeds(): string | null {
    return this._specialNeeds;
  }

  get psychologicalStatus(): PsychologicalStatus {
    return this._psychologicalStatus;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * 고아 여부 확인 (양육시설 아동)
   */
  get isOrphan(): boolean {
    return this._childType.isOrphan;
  }

  /**
   * 아동 생성 (정적 팩토리 메서드)
   * 아동 유형별 관계 비즈니스 규칙 검증
   */
  public static create(
    props: ChildProps,
    id?: string,
    createdAt?: Date,
  ): Result<Child, DomainError> {
    const childTypeValue = props.childType.value;

    // CARE_FACILITY (양육시설 아동, 고아) 검증
    if (childTypeValue === ChildTypeValue.CARE_FACILITY) {
      if (!props.careFacilityId) {
        return Result.fail(new DomainError('양육시설 아동은 양육시설 ID가 필수입니다'));
      }
      if (props.communityChildCenterId) {
        return Result.fail(new DomainError('양육시설 아동은 지역아동센터와 연결될 수 없습니다'));
      }
      if (props.guardianId) {
        return Result.fail(
          new DomainError('양육시설 아동(고아)은 부모 보호자와 연결될 수 없습니다'),
        );
      }
    }

    // COMMUNITY_CENTER (지역아동센터 아동) 검증
    if (childTypeValue === ChildTypeValue.COMMUNITY_CENTER) {
      if (props.careFacilityId) {
        return Result.fail(new DomainError('지역아동센터 아동은 양육시설과 연결될 수 없습니다'));
      }
      if (!props.communityChildCenterId) {
        return Result.fail(new DomainError('지역아동센터 아동은 지역아동센터 ID가 필수입니다'));
      }
      if (!props.guardianId) {
        return Result.fail(new DomainError('지역아동센터 아동은 부모 보호자 ID가 필수입니다'));
      }
    }

    // REGULAR (일반 아동, 부모 직접보호) 검증
    if (childTypeValue === ChildTypeValue.REGULAR) {
      if (props.careFacilityId) {
        return Result.fail(new DomainError('일반 아동은 양육시설과 연결될 수 없습니다'));
      }
      if (props.communityChildCenterId) {
        return Result.fail(new DomainError('일반 아동은 지역아동센터와 연결될 수 없습니다'));
      }
      if (!props.guardianId) {
        return Result.fail(new DomainError('일반 아동은 부모 보호자 ID가 필수입니다'));
      }
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
   * 보호자(부모) 변경
   * - 양육시설 아동은 보호자 변경 불가 (입양 시 유형 자체가 변경됨)
   */
  public changeGuardian(newGuardianId: string): Result<void, DomainError> {
    if (!newGuardianId) {
      return Result.fail(new DomainError('새로운 보호자 ID는 필수입니다'));
    }

    if (this._childType.value === ChildTypeValue.CARE_FACILITY) {
      return Result.fail(
        new DomainError('양육시설 아동은 보호자를 변경할 수 없습니다. 입양 절차를 이용해주세요.'),
      );
    }

    this._guardianId = newGuardianId;
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * 입양 처리 (양육시설 아동 → 일반 아동으로 전환)
   * - 양육시설 아동만 입양 가능
   * - 입양 후 REGULAR 유형으로 변경
   */
  public processAdoption(newGuardianId: string): Result<Child, DomainError> {
    if (!newGuardianId) {
      return Result.fail(new DomainError('입양 부모 ID는 필수입니다'));
    }

    if (this._childType.value !== ChildTypeValue.CARE_FACILITY) {
      return Result.fail(new DomainError('양육시설 아동만 입양 처리가 가능합니다'));
    }

    // 새로운 일반 아동으로 전환 (도메인 이벤트 발행 가능)
    const childTypeResult = ChildType.create(ChildTypeValue.REGULAR);
    if (childTypeResult.isFailure) {
      return Result.fail(childTypeResult.getError());
    }

    return Child.create(
      {
        childType: childTypeResult.getValue(),
        name: this._name,
        birthDate: this._birthDate,
        gender: this._gender,
        careFacilityId: null,
        communityChildCenterId: null,
        guardianId: newGuardianId,
        medicalInfo: this._medicalInfo ?? undefined,
        specialNeeds: this._specialNeeds ?? undefined,
      },
      this._id,
      this._createdAt,
    );
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

  /**
   * 심리 상태 업데이트
   * Soul-E 챗봇에서 위험 징후 감지 시 호출됩니다.
   *
   * @param newStatus 새로운 심리 상태
   * @returns 상태 변경 결과 (escalation: 위험도 상승, deescalation: 위험도 하락)
   */
  public updatePsychologicalStatus(
    newStatus: PsychologicalStatus,
  ): Result<{ isEscalation: boolean; isDeescalation: boolean }, DomainError> {
    if (!newStatus) {
      return Result.fail(new DomainError('새로운 심리 상태는 필수입니다'));
    }

    const previousStatus = this._psychologicalStatus;

    // 동일한 상태면 변경 없음
    if (previousStatus.equals(newStatus)) {
      return Result.ok({ isEscalation: false, isDeescalation: false });
    }

    const isEscalation = previousStatus.isEscalationTo(newStatus);
    const isDeescalation = previousStatus.isDeescalationTo(newStatus);

    this._psychologicalStatus = newStatus;
    this._updatedAt = new Date();

    return Result.ok({ isEscalation, isDeescalation });
  }

  /**
   * 위험 상태 이상인지 확인
   */
  public isAtRiskOrHigher(): boolean {
    return this._psychologicalStatus.isAtRiskOrHigher;
  }

  /**
   * 고위험 상태인지 확인
   */
  public isHighRisk(): boolean {
    return this._psychologicalStatus.isHighRisk;
  }
}
