import { CareType, ConsentStatus, Gender, PriorityReason } from './counsel-request-enums';

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
 * 기본 정보
 */
export interface BasicInfo {
  childInfo: ChildInfo;
  careType: CareType;
  priorityReason?: PriorityReason; // careType === 'PRIORITY'일 때만
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

/**
 * KPRC 검사소견 (yeirin-ai 생성)
 */
export interface KprcAssessmentSummary {
  summaryLines?: string[]; // 요약 문장 (최대 5줄)
  expertOpinion?: string; // 전문가 소견 형태의 종합 요약
  keyFindings?: string[]; // 핵심 발견 사항
  recommendations?: string[]; // 권장 사항
  confidenceScore?: number; // 요약 신뢰도 점수 (0.0 ~ 1.0)
}

/**
 * 검사 결과
 * S3 Key 기반 저장 - Presigned URL은 조회 시 생성
 * @see POST /api/v1/upload/presigned-url (S3 Key → Presigned URL 변환)
 */
export interface TestResults {
  assessmentReportS3Key?: string; // Soul-E KPRC 심리검사 결과 PDF S3 Key
  kprcSummary?: KprcAssessmentSummary; // KPRC 검사소견 (yeirin-ai 생성)
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
