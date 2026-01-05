import { CounselRequestFormData } from '@domain/counsel-request/model/value-objects/counsel-request-form-data';

/**
 * CounselRequestFormData를 AI 추천용 텍스트로 변환
 */
export function formDataToText(formData: CounselRequestFormData): string {
  const parts: string[] = [];

  // 1. 기본 정보
  if (formData.basicInfo?.childInfo) {
    const { name, age, gender, grade } = formData.basicInfo.childInfo;
    parts.push(`아동 이름: ${name}, 나이: ${age}세, 성별: ${gender}`);
    if (grade) parts.push(`학년: ${grade}`);
  }

  // 2. 정서·심리 관련 정보
  if (formData.psychologicalInfo) {
    const { medicalHistory, specialNotes } = formData.psychologicalInfo;
    if (medicalHistory) parts.push(`병력: ${medicalHistory}`);
    if (specialNotes) parts.push(`특이사항: ${specialNotes}`);
  }

  // 3. 의뢰 동기 및 상담 목표
  if (formData.requestMotivation) {
    const { motivation, goals } = formData.requestMotivation;
    if (motivation) parts.push(`의뢰 동기: ${motivation}`);
    if (goals) parts.push(`상담 목표: ${goals}`);
  }

  return parts.join('. ');
}
