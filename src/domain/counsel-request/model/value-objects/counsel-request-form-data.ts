import {
  CareType,
  ConsentStatus,
  Gender,
  PriorityReason,
  ProtectedChildReason,
  ProtectedChildType,
} from './counsel-request-enums';

/**
 * 의뢰 일자
 */
export interface RequestDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

/**
 * 표지 정보
 */
export interface CoverInfo {
  requestDate: RequestDate;
  centerName: string;
  counselorName: string;
}

/**
 * 아동 정보
 */
export interface ChildInfo {
  name: string;
  gender: Gender;
  age: number;
  grade: string; // 예: "초1", "중2", "미취학"
}

/**
 * 보호대상 아동 정보 (새 문서 포맷)
 */
export interface ProtectedChildInfo {
  type?: ProtectedChildType; // 아동양육시설 / 공동생활가정
  reason?: ProtectedChildReason; // 보호 사유
}

/**
 * 기본 정보
 */
export interface BasicInfo {
  childInfo: ChildInfo;
  careType: CareType;
  priorityReason?: PriorityReason; // careType === 'PRIORITY'일 때만
  protectedChildInfo?: ProtectedChildInfo; // 보호대상 아동 정보 (새 문서 포맷)
}

/**
 * 정서·심리 관련 정보
 */
export interface PsychologicalInfo {
  medicalHistory: string; // 기존 아동 병력
  specialNotes: string; // 병력 외 특이사항
}

/**
 * 의뢰 동기 및 상담 목표
 */
export interface RequestMotivation {
  motivation: string; // 의뢰 동기
  goals: string; // 보호자 및 의뢰자의 목표
}

// =============================================================================
// 검사 유형 상수
// =============================================================================

export const ASSESSMENT_TYPES = {
  KPRC: 'KPRC_CO_SG_E',
  CRTES_R: 'CRTES_R',
  SDQ_A: 'SDQ_A',
} as const;

export type AssessmentTypeValue = (typeof ASSESSMENT_TYPES)[keyof typeof ASSESSMENT_TYPES];

// =============================================================================
// 검사소견 타입들 (yeirin-ai 생성)
// =============================================================================

/**
 * 공통 검사소견 필드
 */
export interface BaseAssessmentSummary {
  summaryLines?: string[]; // 요약 문장 (최대 5줄)
  expertOpinion?: string; // 전문가 소견 형태의 종합 요약
  keyFindings?: string[]; // 핵심 발견 사항
  recommendations?: string[]; // 권장 사항
  confidenceScore?: number; // 요약 신뢰도 점수 (0.0 ~ 1.0)
}

/**
 * KPRC 검사소견 (yeirin-ai 생성)
 */
export interface KprcAssessmentSummary extends BaseAssessmentSummary {
  assessmentType?: 'KPRC_CO_SG_E';
}

/**
 * CRTES-R 검사소견 (아동 외상 반응 척도)
 */
export interface CrtesRAssessmentSummary extends BaseAssessmentSummary {
  assessmentType: 'CRTES_R';
  totalScore?: number; // 총점 (0-115)
  riskLevel?: 'normal' | 'caution' | 'high_risk'; // 정상/주의/고위험
  riskLevelDescription?: string; // 위험 수준 설명 (새 문서 포맷)
}

/**
 * SDQ-A 검사소견 (강점·난점 설문지)
 * 새 문서 포맷에서는 강점/난점을 분리하여 표시
 */
export interface SdqAAssessmentSummary extends BaseAssessmentSummary {
  assessmentType: 'SDQ_A';
  // 강점 (사회지향 행동)
  strengthsScore?: number; // 강점 총점 (0-10)
  strengthsLevel?: number; // 강점 수준 (1-3)
  strengthsLevelDescription?: string; // 강점 수준 설명

  // 난점 (외현화 + 내현화)
  difficultiesScore?: number; // 난점 총점 (0-40)
  difficultiesLevel?: number; // 난점 수준 (1-3)
  difficultiesLevelDescription?: string; // 난점 수준 설명
}

/**
 * 검사소견 유니온 타입
 */
export type AssessmentSummary =
  | KprcAssessmentSummary
  | CrtesRAssessmentSummary
  | SdqAAssessmentSummary;

// =============================================================================
// 개별 검사 결과 첨부 정보
// =============================================================================

/**
 * 첨부된 개별 검사 결과 정보
 */
export interface AttachedAssessment {
  assessmentType: AssessmentTypeValue;
  assessmentName: string;
  reportS3Key?: string; // S3 PDF 키 (KPRC만 있음, CRTES-R/SDQ-A는 없음)
  resultId: string; // 검사 결과 ID
  totalScore?: number | null;
  maxScore?: number | null;
  overallLevel?: 'normal' | 'caution' | 'clinical' | null;
  scoredAt?: string | null;
  summary?: AssessmentSummary; // AI 생성 요약 (optional)
}

/**
 * 검사 결과
 * S3 Key 기반 저장 - Presigned URL은 조회 시 생성
 * @see POST /api/v1/upload/presigned-url (S3 Key → Presigned URL 변환)
 */
export interface TestResults {
  // 첨부된 검사 결과들 (최대 3개: KPRC, CRTES-R, SDQ-A)
  attachedAssessments?: AttachedAssessment[];

  // ⚠️ 하위 호환성: 기존 필드 유지 (deprecated, 새 코드에서는 attachedAssessments 사용)
  /** @deprecated Use attachedAssessments instead */
  assessmentReportS3Key?: string; // Soul-E KPRC 심리검사 결과 PDF S3 Key
  /** @deprecated Use attachedAssessments instead */
  kprcSummary?: KprcAssessmentSummary; // KPRC 검사소견 (yeirin-ai 생성)
}

// =============================================================================
// AI 대화 분석 결과 (새 문서 포맷)
// =============================================================================

/**
 * Soul-E AI 대화 분석 결과
 * 새 문서 포맷의 '4.2 AI 기반 아동 마음건강 대화 분석 요약' 섹션에서 사용
 */
export interface ConversationAnalysis {
  summaryLines?: string[]; // 3줄 요약 (긍정적 특성/관심 영역/기대 성장)
  expertAnalysis?: string; // 전문가 종합 분석 (3-4문장)
  keyObservations?: string[]; // 주요 관찰 사항 (2-3가지)
  emotionalKeywords?: string[]; // 정서 상태 키워드
  recommendedFocusAreas?: string[]; // 권장 상담 영역
  confidenceScore?: number; // 분석 신뢰도 (0.0 ~ 1.0)
  sessionCount?: number; // 대화 세션 수
  messageCount?: number; // 대화 메시지 수
}

/**
 * 상담의뢰지 전체 양식 데이터 (JSONB)
 */
export interface CounselRequestFormData {
  coverInfo: CoverInfo;
  basicInfo: BasicInfo;
  psychologicalInfo: PsychologicalInfo;
  requestMotivation: RequestMotivation;
  testResults: TestResults;
  consent: ConsentStatus;
}
