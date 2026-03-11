import { Result, DomainError } from '@domain/common/result';

// ──────────────────────────────────────────────
// Enums
// ──────────────────────────────────────────────

/** 성별 */
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

/** 기관 유형 */
export enum InstitutionType {
  /** 아동양육시설 */
  CHILD_CARE_FACILITY = 'CHILD_CARE_FACILITY',
  /** 공동생활가정 */
  GROUP_HOME = 'GROUP_HOME',
  /** 지역아동센터 */
  COMMUNITY_CHILD_CENTER = 'COMMUNITY_CHILD_CENTER',
  /** 기타 */
  OTHER = 'OTHER',
}

/** 보호자 연락 가능여부 */
export enum GuardianContactAvailability {
  /** 가능 */
  AVAILABLE = 'AVAILABLE',
  /** 제한 */
  LIMITED = 'LIMITED',
  /** 불가 */
  UNAVAILABLE = 'UNAVAILABLE',
}

/** 위기 수준 항목 */
export enum CrisisLevel {
  /** 자해 또는 자살 관련 발언/행동 */
  SELF_HARM_OR_SUICIDE = 'SELF_HARM_OR_SUICIDE',
  /** 심한 우울 또는 무기력 상태 */
  SEVERE_DEPRESSION_OR_LETHARGY = 'SEVERE_DEPRESSION_OR_LETHARGY',
  /** 공격적 행동 또는 충동 조절 어려움 */
  AGGRESSIVE_BEHAVIOR_OR_IMPULSE_CONTROL = 'AGGRESSIVE_BEHAVIOR_OR_IMPULSE_CONTROL',
  /** 또래 관계에서 심각한 갈등 또는 고립 */
  PEER_CONFLICT_OR_ISOLATION = 'PEER_CONFLICT_OR_ISOLATION',
  /** 학교 부적응 또는 등교 거부 */
  SCHOOL_MALADJUSTMENT_OR_REFUSAL = 'SCHOOL_MALADJUSTMENT_OR_REFUSAL',
  /** 반복적인 가출 시도 */
  REPEATED_RUNAWAY_ATTEMPTS = 'REPEATED_RUNAWAY_ATTEMPTS',
  /** 학대 경험 의심 */
  SUSPECTED_ABUSE = 'SUSPECTED_ABUSE',
  /** 기타 */
  OTHER = 'OTHER',
}

/** 보호자 동의 여부 */
export enum GuardianConsentStatus {
  /** 동의함 */
  AGREED = 'AGREED',
  /** 미동의 */
  NOT_AGREED = 'NOT_AGREED',
}

/** Fast-track 의뢰 처리 상태 */
export enum FastTrackReferralStatus {
  /** 접수 완료 */
  SUBMITTED = 'SUBMITTED',
  /** 검토 중 */
  REVIEWING = 'REVIEWING',
  /** 연계 진행 중 */
  IN_PROGRESS = 'IN_PROGRESS',
  /** 완료 */
  COMPLETED = 'COMPLETED',
}

// ──────────────────────────────────────────────
// Props (DB 복원용)
// ──────────────────────────────────────────────

export interface FastTrackReferralProps {
  id: string;
  status: FastTrackReferralStatus;

  // 의뢰 메타 정보
  referralDate: Date;
  institutionName: string;
  staffName: string;

  // 섹션 1: 아동 기본 정보
  childName: string;
  childGender: Gender;
  childAge: number;
  childGrade: string;
  facilityAdmissionDate?: Date;
  institutionType: InstitutionType;
  institutionTypeOther?: string;
  guardianContactAvailability: GuardianContactAvailability;

  // 섹션 2: 현재 위기 수준
  crisisOccurrenceDate: Date;
  crisisLevels: CrisisLevel[];
  crisisLevelOther?: string;

  // 섹션 3: 정서/심리 관련 정보
  hasPreExistingPsychiatricCondition: boolean;
  psychiatricDiagnosisName?: string;
  isCurrentlyOnMedication: boolean;
  medicationName?: string;
  childCharacteristicsAndCounselingNotes?: string;

  // 섹션 4: 최근 문제 행동 및 에피소드
  recentIncidentsAndBehavioralChanges: string;

  // 섹션 5: 의뢰 동기 및 상담 목표
  referralMotivation: string;
  counselingGoal: string;

  // 섹션 6: 개인정보 공유 및 상담 동의
  guardianConsentStatus: GuardianConsentStatus;
  consentPersonName: string;
  relationship: string;
  consentDate: Date;

  // 타임스탬프
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────────────
// Domain Model
// ──────────────────────────────────────────────

/**
 * FastTrackCounselingReferral
 * 긴급 상담의뢰서 (Guardian 프로세스 우회)
 */
export class FastTrackCounselingReferral {
  private constructor(
    private readonly _id: string,
    private _status: FastTrackReferralStatus,

    // 의뢰 메타 정보
    private readonly _referralDate: Date,
    private readonly _institutionName: string,
    private readonly _staffName: string,

    // 섹션 1: 아동 기본 정보
    private readonly _childName: string,
    private readonly _childGender: Gender,
    private readonly _childAge: number,
    private readonly _childGrade: string,
    private readonly _institutionType: InstitutionType,
    private readonly _guardianContactAvailability: GuardianContactAvailability,
    private readonly _facilityAdmissionDate?: Date,
    private readonly _institutionTypeOther?: string,

    // 섹션 2: 현재 위기 수준
    private readonly _crisisOccurrenceDate: Date = new Date(),
    private readonly _crisisLevels: CrisisLevel[] = [],
    private readonly _crisisLevelOther?: string,

    // 섹션 3: 정서/심리 관련 정보
    private readonly _hasPreExistingPsychiatricCondition: boolean = false,
    private readonly _isCurrentlyOnMedication: boolean = false,
    private readonly _psychiatricDiagnosisName?: string,
    private readonly _medicationName?: string,
    private readonly _childCharacteristicsAndCounselingNotes?: string,

    // 섹션 4: 최근 문제 행동 및 에피소드
    private readonly _recentIncidentsAndBehavioralChanges: string = '',

    // 섹션 5: 의뢰 동기 및 상담 목표
    private readonly _referralMotivation: string = '',
    private readonly _counselingGoal: string = '',

    // 섹션 6: 개인정보 공유 및 상담 동의
    private readonly _guardianConsentStatus: GuardianConsentStatus = GuardianConsentStatus.AGREED,
    private readonly _consentPersonName: string = '',
    private readonly _relationship: string = '',
    private readonly _consentDate: Date = new Date(),

    // 타임스탬프
    private readonly _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
  ) {}

  // ============================================
  // Getters
  // ============================================

  get id(): string {
    return this._id;
  }

  get status(): FastTrackReferralStatus {
    return this._status;
  }

  get referralDate(): Date {
    return this._referralDate;
  }

  get institutionName(): string {
    return this._institutionName;
  }

  get staffName(): string {
    return this._staffName;
  }

  get childName(): string {
    return this._childName;
  }

  get childGender(): Gender {
    return this._childGender;
  }

  get childAge(): number {
    return this._childAge;
  }

  get childGrade(): string {
    return this._childGrade;
  }

  get facilityAdmissionDate(): Date | undefined {
    return this._facilityAdmissionDate;
  }

  get institutionType(): InstitutionType {
    return this._institutionType;
  }

  get institutionTypeOther(): string | undefined {
    return this._institutionTypeOther;
  }

  get guardianContactAvailability(): GuardianContactAvailability {
    return this._guardianContactAvailability;
  }

  get crisisOccurrenceDate(): Date {
    return this._crisisOccurrenceDate;
  }

  get crisisLevels(): CrisisLevel[] {
    return [...this._crisisLevels];
  }

  get crisisLevelOther(): string | undefined {
    return this._crisisLevelOther;
  }

  get hasPreExistingPsychiatricCondition(): boolean {
    return this._hasPreExistingPsychiatricCondition;
  }

  get psychiatricDiagnosisName(): string | undefined {
    return this._psychiatricDiagnosisName;
  }

  get isCurrentlyOnMedication(): boolean {
    return this._isCurrentlyOnMedication;
  }

  get medicationName(): string | undefined {
    return this._medicationName;
  }

  get childCharacteristicsAndCounselingNotes(): string | undefined {
    return this._childCharacteristicsAndCounselingNotes;
  }

  get recentIncidentsAndBehavioralChanges(): string {
    return this._recentIncidentsAndBehavioralChanges;
  }

  get referralMotivation(): string {
    return this._referralMotivation;
  }

  get counselingGoal(): string {
    return this._counselingGoal;
  }

  get guardianConsentStatus(): GuardianConsentStatus {
    return this._guardianConsentStatus;
  }

  get consentPersonName(): string {
    return this._consentPersonName;
  }

  get relationship(): string {
    return this._relationship;
  }

  get consentDate(): Date {
    return this._consentDate;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ============================================
  // Factory Methods
  // ============================================

  /**
   * 새로운 긴급 상담의뢰서 생성 (SUBMITTED 상태로 시작)
   */
  static create(props: {
    id: string;
    referralDate: Date;
    institutionName: string;
    staffName: string;
    childName: string;
    childGender: Gender;
    childAge: number;
    childGrade: string;
    institutionType: InstitutionType;
    guardianContactAvailability: GuardianContactAvailability;
    facilityAdmissionDate?: Date;
    institutionTypeOther?: string;
    crisisOccurrenceDate: Date;
    crisisLevels: CrisisLevel[];
    crisisLevelOther?: string;
    hasPreExistingPsychiatricCondition: boolean;
    isCurrentlyOnMedication: boolean;
    psychiatricDiagnosisName?: string;
    medicationName?: string;
    childCharacteristicsAndCounselingNotes?: string;
    recentIncidentsAndBehavioralChanges: string;
    referralMotivation: string;
    counselingGoal: string;
    guardianConsentStatus: GuardianConsentStatus;
    consentPersonName: string;
    relationship: string;
    consentDate: Date;
  }): Result<FastTrackCounselingReferral, DomainError> {
    if (!props.id || props.id.trim().length === 0) {
      return Result.fail(new DomainError('긴급 의뢰 ID는 필수입니다'));
    }

    if (!props.childName || props.childName.trim().length === 0) {
      return Result.fail(new DomainError('아동 이름은 필수입니다'));
    }

    if (!props.institutionName || props.institutionName.trim().length === 0) {
      return Result.fail(new DomainError('기관명은 필수입니다'));
    }

    if (!props.crisisLevels || props.crisisLevels.length === 0) {
      return Result.fail(new DomainError('위기 수준 항목은 최소 1개 이상 선택해야 합니다'));
    }

    return Result.ok(
      new FastTrackCounselingReferral(
        props.id,
        FastTrackReferralStatus.SUBMITTED,
        props.referralDate,
        props.institutionName,
        props.staffName,
        props.childName,
        props.childGender,
        props.childAge,
        props.childGrade,
        props.institutionType,
        props.guardianContactAvailability,
        props.facilityAdmissionDate,
        props.institutionTypeOther,
        props.crisisOccurrenceDate,
        props.crisisLevels,
        props.crisisLevelOther,
        props.hasPreExistingPsychiatricCondition,
        props.isCurrentlyOnMedication,
        props.psychiatricDiagnosisName,
        props.medicationName,
        props.childCharacteristicsAndCounselingNotes,
        props.recentIncidentsAndBehavioralChanges,
        props.referralMotivation,
        props.counselingGoal,
        props.guardianConsentStatus,
        props.consentPersonName,
        props.relationship,
        props.consentDate,
        new Date(),
        new Date(),
      ),
    );
  }

  /**
   * DB에서 복원
   */
  static restore(props: FastTrackReferralProps): FastTrackCounselingReferral {
    return new FastTrackCounselingReferral(
      props.id,
      props.status,
      props.referralDate,
      props.institutionName,
      props.staffName,
      props.childName,
      props.childGender,
      props.childAge,
      props.childGrade,
      props.institutionType,
      props.guardianContactAvailability,
      props.facilityAdmissionDate,
      props.institutionTypeOther,
      props.crisisOccurrenceDate,
      props.crisisLevels,
      props.crisisLevelOther,
      props.hasPreExistingPsychiatricCondition,
      props.isCurrentlyOnMedication,
      props.psychiatricDiagnosisName,
      props.medicationName,
      props.childCharacteristicsAndCounselingNotes,
      props.recentIncidentsAndBehavioralChanges,
      props.referralMotivation,
      props.counselingGoal,
      props.guardianConsentStatus,
      props.consentPersonName,
      props.relationship,
      props.consentDate,
      props.createdAt,
      props.updatedAt,
    );
  }

  // ============================================
  // Business Logic
  // ============================================

  /**
   * 상태 변경
   */
  changeStatus(status: FastTrackReferralStatus): Result<void, DomainError> {
    this._status = status;
    this._updatedAt = new Date();
    return Result.ok(undefined);
  }
}
