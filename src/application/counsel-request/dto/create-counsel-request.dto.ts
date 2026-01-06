import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  CareType,
  ConsentStatus,
  Gender,
  PriorityReason,
  ProtectedChildReason,
  ProtectedChildType,
} from '@domain/counsel-request/model/value-objects/counsel-request-enums';
import {
  AssessmentTypeValue,
  ASSESSMENT_TYPES,
} from '@domain/counsel-request/model/value-objects/counsel-request-form-data';

// ============================================
// Sub DTOs
// ============================================

export class RequestDateDto {
  @ApiProperty({ description: '년', example: 2024 })
  @IsInt()
  year: number;

  @ApiProperty({ description: '월', example: 11, minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ description: '일', example: 18, minimum: 1, maximum: 31 })
  @IsInt()
  @Min(1)
  @Max(31)
  day: number;
}

export class CoverInfoDto {
  @ApiProperty({ description: '의뢰 일자' })
  @ValidateNested()
  @Type(() => RequestDateDto)
  requestDate: RequestDateDto;

  @ApiProperty({ description: '센터명', example: '서울아동발달센터' })
  @IsString()
  @IsNotEmpty()
  centerName: string;

  @ApiProperty({ description: '담당자 이름', example: '홍길동' })
  @IsString()
  @IsNotEmpty()
  counselorName: string;
}

/**
 * 생년월일 DTO (사회서비스 이용 추천서용)
 */
export class BirthDateDto {
  @ApiProperty({ description: '년', example: 2015 })
  @IsInt()
  year: number;

  @ApiProperty({ description: '월', example: 3, minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ description: '일', example: 15, minimum: 1, maximum: 31 })
  @IsInt()
  @Min(1)
  @Max(31)
  day: number;
}

export class ChildInfoDto {
  @ApiProperty({ description: '아동 이름', example: '김철수' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '성별', enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ description: '연령', example: 7 })
  @IsInt()
  @Min(0)
  age: number;

  @ApiProperty({ description: '학년', example: '초1' })
  @IsString()
  grade: string;

  @ApiProperty({ description: '생년월일 (사회서비스 이용 추천서용)', required: false })
  @ValidateNested()
  @Type(() => BirthDateDto)
  @IsOptional()
  birthDate?: BirthDateDto;
}

/**
 * 보호대상 아동 정보 DTO (새 문서 포맷)
 */
export class ProtectedChildInfoDto {
  @ApiProperty({
    description: '보호대상 아동 유형',
    enum: ProtectedChildType,
    example: ProtectedChildType.CHILD_FACILITY,
    required: false,
  })
  @IsEnum(ProtectedChildType)
  @IsOptional()
  type?: ProtectedChildType;

  @ApiProperty({
    description: '보호 사유',
    enum: ProtectedChildReason,
    example: ProtectedChildReason.GUARDIAN_ABSENCE,
    required: false,
  })
  @IsEnum(ProtectedChildReason)
  @IsOptional()
  reason?: ProtectedChildReason;
}

export class BasicInfoDto {
  @ApiProperty({ description: '아동 정보' })
  @ValidateNested()
  @Type(() => ChildInfoDto)
  childInfo: ChildInfoDto;

  @ApiProperty({ description: '센터 이용 기준', enum: CareType, example: CareType.PRIORITY })
  @IsEnum(CareType)
  careType: CareType;

  @ApiProperty({
    description: '우선돌봄 세부 사유 (careType이 PRIORITY일 때 필수)',
    enum: PriorityReason,
    required: false,
  })
  @IsEnum(PriorityReason)
  @IsOptional()
  priorityReason?: PriorityReason;

  @ApiProperty({
    description: '보호대상 아동 정보 (새 문서 포맷)',
    type: ProtectedChildInfoDto,
    required: false,
  })
  @ValidateNested()
  @Type(() => ProtectedChildInfoDto)
  @IsOptional()
  protectedChildInfo?: ProtectedChildInfoDto;
}

export class PsychologicalInfoDto {
  @ApiProperty({ description: '기존 아동 병력', example: 'ADHD 진단 받음 (2023년)' })
  @IsString()
  medicalHistory: string;

  @ApiProperty({ description: '병력 외 특이사항', example: '학교 적응에 어려움' })
  @IsString()
  specialNotes: string;
}

export class RequestMotivationDto {
  @ApiProperty({ description: '의뢰 동기', example: '학교에서 집중하지 못하고 자주 다툼' })
  @IsString()
  @IsNotEmpty()
  motivation: string;

  @ApiProperty({ description: '보호자 및 의뢰자의 목표', example: '자기 조절 능력 향상' })
  @IsString()
  @IsNotEmpty()
  goals: string;
}

// =============================================================================
// 검사소견 DTOs
// =============================================================================

/**
 * 공통 검사소견 DTO
 */
export class BaseAssessmentSummaryDto {
  @ApiProperty({
    description: '요약 문장 (최대 5줄)',
    example: [
      '아동은 전반적으로 양호한 적응 수준을 보입니다.',
      '또래 관계에서 다소 어려움이 관찰됩니다.',
    ],
    type: [String],
    required: false,
  })
  @IsString({ each: true })
  @IsOptional()
  summaryLines?: string[];

  @ApiProperty({
    description: '전문가 소견 형태의 종합 요약',
    example:
      '본 아동은 KPRC 검사 결과, 전반적인 적응 수준이 양호한 것으로 나타났습니다. 다만, 또래 관계에서 다소 어려움이 관찰되어 사회성 향상을 위한 지원이 권장됩니다.',
    required: false,
  })
  @IsString()
  @IsOptional()
  expertOpinion?: string;

  @ApiProperty({
    description: '핵심 발견 사항',
    example: ['전반적 적응 수준 양호', '또래 관계 어려움 관찰', '정서적 안정감 높음'],
    type: [String],
    required: false,
  })
  @IsString({ each: true })
  @IsOptional()
  keyFindings?: string[];

  @ApiProperty({
    description: '권장 사항',
    example: ['사회성 향상 프로그램 참여 권장', '또래 관계 개선을 위한 상담 권장'],
    type: [String],
    required: false,
  })
  @IsString({ each: true })
  @IsOptional()
  recommendations?: string[];

  @ApiProperty({
    description: '요약 신뢰도 점수 (0.0 ~ 1.0)',
    example: 0.85,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsOptional()
  confidenceScore?: number;
}

/**
 * KPRC 검사소견 DTO (하위 호환성 유지)
 */
export class KprcAssessmentSummaryDto extends BaseAssessmentSummaryDto {
  @ApiProperty({
    description: '검사 유형',
    example: 'KPRC_CO_SG_E',
    required: false,
  })
  @IsString()
  @IsOptional()
  assessmentType?: 'KPRC_CO_SG_E';
}

/**
 * CRTES-R 검사소견 DTO (아동 외상 반응 척도)
 */
export class CrtesRAssessmentSummaryDto extends BaseAssessmentSummaryDto {
  @ApiProperty({
    description: '검사 유형',
    example: 'CRTES_R',
  })
  @IsString()
  assessmentType: 'CRTES_R';

  @ApiProperty({
    description: '총점 (0-115)',
    example: 45,
    required: false,
  })
  @IsOptional()
  totalScore?: number;

  @ApiProperty({
    description: '위험 수준',
    enum: ['normal', 'caution', 'high_risk'],
    example: 'caution',
    required: false,
  })
  @IsString()
  @IsOptional()
  riskLevel?: 'normal' | 'caution' | 'high_risk';

  @ApiProperty({
    description: '위험 수준 설명 (새 문서 포맷)',
    example: '일부 외상 반응이 관찰되어 주의가 필요합니다.',
    required: false,
  })
  @IsString()
  @IsOptional()
  riskLevelDescription?: string;
}

/**
 * SDQ-A 검사소견 DTO (강점·난점 설문지)
 * 새 문서 포맷에서는 강점/난점을 분리하여 표시
 */
export class SdqAAssessmentSummaryDto extends BaseAssessmentSummaryDto {
  @ApiProperty({
    description: '검사 유형',
    example: 'SDQ_A',
  })
  @IsString()
  assessmentType: 'SDQ_A';

  // 강점 (사회지향 행동)
  @ApiProperty({
    description: '강점 총점 (0-10)',
    example: 7,
    required: false,
  })
  @IsOptional()
  strengthsScore?: number;

  @ApiProperty({
    description: '강점 수준 (1-3)',
    example: 2,
    required: false,
  })
  @IsOptional()
  strengthsLevel?: number;

  @ApiProperty({
    description: '강점 수준 설명',
    example: '평균적인 수준의 사회지향 행동을 보입니다.',
    required: false,
  })
  @IsString()
  @IsOptional()
  strengthsLevelDescription?: string;

  // 난점 (외현화 + 내현화)
  @ApiProperty({
    description: '난점 총점 (0-40)',
    example: 18,
    required: false,
  })
  @IsOptional()
  difficultiesScore?: number;

  @ApiProperty({
    description: '난점 수준 (1-3)',
    example: 2,
    required: false,
  })
  @IsOptional()
  difficultiesLevel?: number;

  @ApiProperty({
    description: '난점 수준 설명',
    example: '일부 영역에서 어려움이 관찰됩니다.',
    required: false,
  })
  @IsString()
  @IsOptional()
  difficultiesLevelDescription?: string;
}

/**
 * AI 대화 분석 결과 DTO (Soul-E 대화 기반)
 * 새 문서 포맷의 '4.2 AI 기반 아동 마음건강 대화 분석 요약' 섹션
 */
export class ConversationAnalysisDto {
  @ApiProperty({
    description: '3줄 요약 (긍정적 특성/관심 영역/기대 성장)',
    example: [
      '아동은 밝고 긍정적인 태도를 유지합니다.',
      '친구 관계에서 관심과 기대가 높습니다.',
      '자기 조절 능력의 성장이 기대됩니다.',
    ],
    type: [String],
    required: false,
  })
  @IsString({ each: true })
  @IsOptional()
  summaryLines?: string[];

  @ApiProperty({
    description: '전문가 종합 분석 (3-4문장)',
    example:
      '본 아동은 AI 대화 분석 결과, 전반적으로 밝고 긍정적인 태도를 보이며 친구 관계에 대한 관심이 높은 것으로 나타났습니다.',
    required: false,
  })
  @IsString()
  @IsOptional()
  expertAnalysis?: string;

  @ApiProperty({
    description: '주요 관찰 사항 (2-3가지)',
    example: ['또래 관계에 대한 관심 높음', '자기 표현 능력 양호'],
    type: [String],
    required: false,
  })
  @IsString({ each: true })
  @IsOptional()
  keyObservations?: string[];

  @ApiProperty({
    description: '정서 상태 키워드',
    example: ['밝음', '호기심', '불안'],
    type: [String],
    required: false,
  })
  @IsString({ each: true })
  @IsOptional()
  emotionalKeywords?: string[];

  @ApiProperty({
    description: '권장 상담 영역',
    example: ['또래 관계', '자기 조절'],
    type: [String],
    required: false,
  })
  @IsString({ each: true })
  @IsOptional()
  recommendedFocusAreas?: string[];

  @ApiProperty({
    description: '분석 신뢰도 (0.0 ~ 1.0)',
    example: 0.85,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsOptional()
  confidenceScore?: number;

  @ApiProperty({
    description: '대화 세션 수',
    example: 5,
    required: false,
  })
  @IsOptional()
  sessionCount?: number;

  @ApiProperty({
    description: '대화 메시지 수',
    example: 42,
    required: false,
  })
  @IsOptional()
  messageCount?: number;
}

/**
 * 첨부된 검사 결과 DTO
 */
export class AttachedAssessmentDto {
  @ApiProperty({
    description: '검사 유형',
    example: 'KPRC_CO_SG_E',
    enum: Object.values(ASSESSMENT_TYPES),
  })
  @IsEnum(Object.values(ASSESSMENT_TYPES) as unknown as object)
  @IsNotEmpty()
  assessmentType: AssessmentTypeValue;

  @ApiProperty({
    description: '검사명',
    example: 'KPRC 인성평정척도',
  })
  @IsString()
  @IsNotEmpty()
  assessmentName: string;

  @ApiProperty({
    description: '결과 PDF S3 키 (KPRC만 있음, CRTES-R/SDQ-A는 없음)',
    example: 'assessment-reports/KPRC_홍길동_abc12345_20240115.pdf',
    required: false,
  })
  @IsString()
  @IsOptional()
  reportS3Key?: string;

  @ApiProperty({
    description: '검사 결과 ID',
    example: 'uuid-string',
  })
  @IsString()
  @IsNotEmpty()
  resultId: string;

  @ApiProperty({
    description: '총점',
    example: 85,
    required: false,
  })
  @IsOptional()
  totalScore?: number | null;

  @ApiProperty({
    description: '만점',
    example: 100,
    required: false,
  })
  @IsOptional()
  maxScore?: number | null;

  @ApiProperty({
    description: '전반적 수준',
    example: 'normal',
    enum: ['normal', 'caution', 'clinical'],
    required: false,
  })
  @IsString()
  @IsOptional()
  overallLevel?: 'normal' | 'caution' | 'clinical' | null;

  @ApiProperty({
    description: '채점 일시',
    example: '2024-01-15T12:00:00Z',
    required: false,
  })
  @IsString()
  @IsOptional()
  scoredAt?: string | null;

  @ApiProperty({
    description: 'AI 생성 요약',
    required: false,
    type: BaseAssessmentSummaryDto,
  })
  @ValidateNested()
  @Type(() => BaseAssessmentSummaryDto)
  @IsOptional()
  summary?: BaseAssessmentSummaryDto;
}

/**
 * 보호자 정보 DTO (사회서비스 이용 추천서용)
 */
export class GuardianInfoDto {
  @ApiProperty({ description: '보호자 성명', example: '홍부모' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '전화번호 (휴대전화)', example: '010-1234-5678' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ description: '자택 전화번호', example: '02-1234-5678', required: false })
  @IsString()
  @IsOptional()
  homePhone?: string;

  @ApiProperty({ description: '주소', example: '서울시 강남구 테헤란로 123' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: '상세 주소', example: '101동 1001호', required: false })
  @IsString()
  @IsOptional()
  addressDetail?: string;

  @ApiProperty({ description: '이용자와의 관계', example: '부' })
  @IsString()
  @IsNotEmpty()
  relationToChild: string;
}

/**
 * 기관/작성자 정보 DTO (사회서비스 이용 추천서용)
 */
export class InstitutionInfoDto {
  @ApiProperty({ description: '소속기관명', example: '서울초등학교' })
  @IsString()
  @IsNotEmpty()
  institutionName: string;

  @ApiProperty({ description: '기관 연락처', example: '02-123-4567' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ description: '기관 소재지', example: '서울시 강남구 학동로 456' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: '상세 주소', required: false })
  @IsString()
  @IsOptional()
  addressDetail?: string;

  @ApiProperty({ description: '직 또는 자격', example: '담임교사' })
  @IsString()
  @IsNotEmpty()
  writerPosition: string;

  @ApiProperty({ description: '작성자 성명', example: '김선생' })
  @IsString()
  @IsNotEmpty()
  writerName: string;

  @ApiProperty({ description: '이용자와의 관계', example: '담임교사' })
  @IsString()
  @IsNotEmpty()
  relationToChild: string;
}

/**
 * 검사 결과 DTO
 * S3 Key 기반 저장 - Presigned URL은 조회 시 생성
 * @see POST /api/v1/upload/presigned-url (S3 Key → Presigned URL 변환)
 */
export class TestResultsDto {
  @ApiProperty({
    description: '첨부된 검사 결과들 (최대 3개: KPRC, CRTES-R, SDQ-A)',
    required: false,
    type: [AttachedAssessmentDto],
  })
  @ValidateNested({ each: true })
  @Type(() => AttachedAssessmentDto)
  @IsOptional()
  attachedAssessments?: AttachedAssessmentDto[];

  // ⚠️ 하위 호환성: 기존 필드 유지 (deprecated, 새 코드에서는 attachedAssessments 사용)

  /** @deprecated Use attachedAssessments instead */
  @ApiProperty({
    description: '[Deprecated] Soul-E KPRC 심리검사 결과 PDF S3 Key',
    required: false,
    example: 'assessment-reports/KPRC_홍길동_abc12345_20240115.pdf',
    deprecated: true,
  })
  @IsString()
  @IsOptional()
  assessmentReportS3Key?: string;

  /** @deprecated Use attachedAssessments instead */
  @ApiProperty({
    description: '[Deprecated] KPRC 검사소견 (yeirin-ai 생성)',
    required: false,
    type: KprcAssessmentSummaryDto,
    deprecated: true,
  })
  @ValidateNested()
  @Type(() => KprcAssessmentSummaryDto)
  @IsOptional()
  kprcSummary?: KprcAssessmentSummaryDto;
}

// ============================================
// Main DTO
// ============================================

export class CreateCounselRequestDto {
  @ApiProperty({ description: '아동 ID (UUID)' })
  @IsUUID()
  childId: string;

  @ApiProperty({ description: '표지 정보' })
  @IsObject()
  @ValidateNested()
  @Type(() => CoverInfoDto)
  coverInfo: CoverInfoDto;

  @ApiProperty({ description: '기본 정보' })
  @IsObject()
  @ValidateNested()
  @Type(() => BasicInfoDto)
  basicInfo: BasicInfoDto;

  @ApiProperty({ description: '정서·심리 관련 정보' })
  @IsObject()
  @ValidateNested()
  @Type(() => PsychologicalInfoDto)
  psychologicalInfo: PsychologicalInfoDto;

  @ApiProperty({ description: '의뢰 동기 및 상담 목표' })
  @IsObject()
  @ValidateNested()
  @Type(() => RequestMotivationDto)
  requestMotivation: RequestMotivationDto;

  @ApiProperty({ description: '소울이 검사 결과지' })
  @IsObject()
  @ValidateNested()
  @Type(() => TestResultsDto)
  testResults: TestResultsDto;

  @ApiProperty({ description: '보호자 동의 여부', enum: ConsentStatus })
  @IsEnum(ConsentStatus)
  consent: ConsentStatus;

  // ============================================
  // 사회서비스 이용 추천서 (Government Doc) 전용 - Optional
  // ============================================

  @ApiProperty({
    description: '보호자 정보 (사회서비스 이용 추천서용)',
    required: false,
    type: GuardianInfoDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => GuardianInfoDto)
  @IsOptional()
  guardianInfo?: GuardianInfoDto;

  @ApiProperty({
    description: '기관/작성자 정보 (사회서비스 이용 추천서용)',
    required: false,
    type: InstitutionInfoDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => InstitutionInfoDto)
  @IsOptional()
  institutionInfo?: InstitutionInfoDto;
}
