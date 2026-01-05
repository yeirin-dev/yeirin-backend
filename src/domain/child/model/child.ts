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
 * 1. CARE_FACILITY (양육시설 아동):
 *    - careFacilityId 필수
 *    - communityChildCenterId null
 *
 * 2. COMMUNITY_CENTER (지역아동센터 아동):
 *    - careFacilityId null
 *    - communityChildCenterId 필수
 *
 * NOTE: 모든 아동은 시설(Institution)에 직접 연결됩니다.
 *       Guardian 연결은 제거되었습니다.
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
   *
   * NOTE: 모든 아동은 시설(Institution)에 직접 연결됩니다.
   */
  public static create(
    props: ChildProps,
    id?: string,
    createdAt?: Date,
  ): Result<Child, DomainError> {
    const childTypeValue = props.childType.value;

    // CARE_FACILITY (양육시설 아동) 검증
    if (childTypeValue === ChildTypeValue.CARE_FACILITY) {
      if (!props.careFacilityId) {
        return Result.fail(new DomainError('양육시설 아동은 양육시설 ID가 필수입니다'));
      }
      if (props.communityChildCenterId) {
        return Result.fail(new DomainError('양육시설 아동은 지역아동센터와 연결될 수 없습니다'));
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
    }

    // REGULAR 유형은 더 이상 지원되지 않음 (시설 연결 필수)
    if (childTypeValue === ChildTypeValue.REGULAR) {
      return Result.fail(
        new DomainError(
          '일반 아동 유형은 더 이상 지원되지 않습니다. 시설에 연결된 아동만 등록 가능합니다.',
        ),
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
