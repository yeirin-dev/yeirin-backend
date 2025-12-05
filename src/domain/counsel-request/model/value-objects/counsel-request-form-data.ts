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
 * 소울이 검사 결과지 (이미지 URL)
 */
export interface TestResults {
  childReactionScale?: string; // 아동 반응척도 심리검사
  strengthSurvey?: string; // 강점 설문지 심리검사
  difficultySurvey?: string; // 난점 설문지 심리검사
  assessmentReportUrl?: string; // Soul-E KPRC 심리검사 결과 PDF URL (S3)
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
