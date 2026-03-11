import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  ValidateNested,
  IsDateString,
  Min,
  Max,
  ArrayMinSize,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

// ──────────────────────────────────────────────
// 섹션 1: 아동 기본 정보
// ──────────────────────────────────────────────

export class ChildBasicInfoDto {
  @ApiProperty({ description: '아동 이름' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: Gender, description: '성별' })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ description: '연령 (만 나이)' })
  @IsInt()
  @Min(0)
  @Max(18)
  age: number;

  @ApiProperty({ description: '학년 (예: "초등학교 3학년", "중학교 1학년")' })
  @IsString()
  @IsNotEmpty()
  grade: string;

  @ApiPropertyOptional({ description: '시설 입소일 / 센터 이용시작일 (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  facilityAdmissionDate?: string;

  @ApiProperty({ enum: InstitutionType, description: '기관 유형' })
  @IsEnum(InstitutionType)
  institutionType: InstitutionType;

  @ApiPropertyOptional({ description: '기관 유형이 OTHER일 경우 직접 입력' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  institutionTypeOther?: string;

  @ApiProperty({
    enum: GuardianContactAvailability,
    description: '보호자 연락 가능여부',
  })
  @IsEnum(GuardianContactAvailability)
  guardianContactAvailability: GuardianContactAvailability;
}

// ──────────────────────────────────────────────
// 섹션 2: 현재 위기 수준
// ──────────────────────────────────────────────

export class CrisisStatusDto {
  @ApiProperty({ description: '위기 발생 시점 (ISO 8601 date)' })
  @IsDateString()
  crisisOccurrenceDate: string;

  @ApiProperty({
    enum: CrisisLevel,
    isArray: true,
    description: '위기 수준 체크항목 (복수 선택 가능)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(CrisisLevel, { each: true })
  crisisLevels: CrisisLevel[];

  @ApiPropertyOptional({
    description: '위기 수준이 OTHER 포함 시 직접 작성 내용',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  crisisLevelOther?: string;
}

// ──────────────────────────────────────────────
// 섹션 3: 정서/심리 관련 정보
// ──────────────────────────────────────────────

export class PsychologicalInfoDto {
  @ApiProperty({ description: '기존 신경정신과 질환 유무' })
  @IsBoolean()
  hasPreExistingPsychiatricCondition: boolean;

  @ApiPropertyOptional({
    description: '기존 신경정신과 질환 있음 시 진단명',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  psychiatricDiagnosisName?: string;

  @ApiProperty({ description: '현재 복용 중인 약물 유무' })
  @IsBoolean()
  isCurrentlyOnMedication: boolean;

  @ApiPropertyOptional({ description: '현재 복용 중인 약물 있음 시 약물명' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  medicationName?: string;

  @ApiPropertyOptional({
    description: '아동 특성 및 면담 시 주의사항',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  childCharacteristicsAndCounselingNotes?: string;
}

// ──────────────────────────────────────────────
// 섹션 4: 최근 문제 행동 및 에피소드
// ──────────────────────────────────────────────

export class RecentBehaviorDto {
  @ApiProperty({
    description:
      '최근 1개월 이내의 주요 사건 또는 행동 변화 (최대한 구체적으로 작성)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  recentIncidentsAndBehavioralChanges: string;
}

// ──────────────────────────────────────────────
// 섹션 5: 의뢰 동기 및 상담 목표
// ──────────────────────────────────────────────

export class ReferralMotivationDto {
  @ApiProperty({ description: '의뢰 동기' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  referralMotivation: string;

  @ApiProperty({ description: '상담 목표' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  counselingGoal: string;
}

// ──────────────────────────────────────────────
// 섹션 6: 개인정보 공유 및 상담 동의
// ──────────────────────────────────────────────

export class PrivacyConsentDto {
  @ApiProperty({
    enum: GuardianConsentStatus,
    description: '보호자 동의 여부',
  })
  @IsEnum(GuardianConsentStatus)
  guardianConsentStatus: GuardianConsentStatus;

  @ApiProperty({ description: '동의자 성명' })
  @IsString()
  @IsNotEmpty()
  consentPersonName: string;

  @ApiProperty({ description: '동의자와 아동의 관계' })
  @IsString()
  @IsNotEmpty()
  relationship: string;

  @ApiProperty({ description: '동의 날짜 (ISO 8601 date)' })
  @IsDateString()
  consentDate: string;
}

// ──────────────────────────────────────────────
// 최상위 DTO: Fast-track 상담의뢰서 전체
// ──────────────────────────────────────────────

export class CreateFastTrackCounselingReferralDto {
  // ── 의뢰 메타 정보 (상단 헤더) ──

  @ApiProperty({ description: '의뢰일자 (ISO 8601 date)' })
  @IsDateString()
  referralDate: string;

  @ApiProperty({ description: '기관명' })
  @IsString()
  @IsNotEmpty()
  institutionName: string;

  @ApiProperty({ description: '담당자 성명' })
  @IsString()
  @IsNotEmpty()
  staffName: string;

  // ── 섹션 1: 아동 기본 정보 ──

  @ApiProperty({ type: ChildBasicInfoDto, description: '1. 아동 기본 정보' })
  @ValidateNested()
  @Type(() => ChildBasicInfoDto)
  childBasicInfo: ChildBasicInfoDto;

  // ── 섹션 2: 현재 위기 수준 ──

  @ApiProperty({ type: CrisisStatusDto, description: '2. 현재 위기 수준' })
  @ValidateNested()
  @Type(() => CrisisStatusDto)
  crisisStatus: CrisisStatusDto;

  // ── 섹션 3: 정서/심리 관련 정보 ──

  @ApiProperty({
    type: PsychologicalInfoDto,
    description: '3. 정서/심리 관련 정보',
  })
  @ValidateNested()
  @Type(() => PsychologicalInfoDto)
  psychologicalInfo: PsychologicalInfoDto;

  // ── 섹션 4: 최근 문제 행동 및 에피소드 ──

  @ApiProperty({
    type: RecentBehaviorDto,
    description: '4. 최근 문제 행동 및 에피소드',
  })
  @ValidateNested()
  @Type(() => RecentBehaviorDto)
  recentBehavior: RecentBehaviorDto;

  // ── 섹션 5: 의뢰 동기 및 상담 목표 ──

  @ApiProperty({
    type: ReferralMotivationDto,
    description: '5. 의뢰 동기 및 상담 목표',
  })
  @ValidateNested()
  @Type(() => ReferralMotivationDto)
  referralMotivation: ReferralMotivationDto;

  // ── 섹션 6: 개인정보 공유 및 상담 동의 ──

  @ApiProperty({
    type: PrivacyConsentDto,
    description: '6. 개인정보 공유 및 상담 동의',
  })
  @ValidateNested()
  @Type(() => PrivacyConsentDto)
  privacyConsent: PrivacyConsentDto;
}

// ──────────────────────────────────────────────
// 응답 DTO
// ──────────────────────────────────────────────

export class FastTrackReferralResponseDto {
  @ApiProperty({ description: '생성된 의뢰 ID' })
  id: string;

  @ApiProperty({ description: '처리 상태' })
  status: string;

  @ApiProperty({ description: '접수 일시' })
  createdAt: Date;
}
