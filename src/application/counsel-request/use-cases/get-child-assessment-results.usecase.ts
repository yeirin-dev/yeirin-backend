import { Injectable, Logger } from '@nestjs/common';
import { SoulEClient } from '@infrastructure/external/soul-e.client';
import { AssessmentResultResponseDto } from '../dto/assessment-result-response.dto';

/**
 * 아동의 Soul-E 검사 결과 목록 조회 Use Case
 *
 * Soul-E MSA에서 아동 ID로 검사 결과를 조회하여 반환합니다.
 * 상담의뢰지 작성 시 검사 결과 PDF를 첨부하기 위해 사용됩니다.
 */
@Injectable()
export class GetChildAssessmentResultsUseCase {
  private readonly logger = new Logger(GetChildAssessmentResultsUseCase.name);

  constructor(private readonly soulEClient: SoulEClient) {}

  /**
   * 아동의 검사 결과 목록을 조회합니다.
   * @param childId yeirin 백엔드의 아동 ID
   * @returns 검사 결과 요약 DTO 목록
   */
  async execute(childId: string): Promise<AssessmentResultResponseDto[]> {
    this.logger.log(`아동 검사 결과 조회 - childId: ${childId}`);

    const results = await this.soulEClient.getAssessmentResults(childId);

    return results.map((result) => ({
      resultId: result.result_id,
      sessionId: result.session_id,
      childId: result.child_id,
      childName: result.child_name,
      assessmentType: result.assessment_type,
      assessmentName: result.assessment_name,
      totalScore: result.total_score,
      maxScore: result.max_score,
      overallLevel: result.overall_level,
      // s3_report_url (영구 URL) 우선 사용, 없으면 report_url (만료될 수 있음) 사용
      reportUrl: result.s3_report_url ?? result.report_url,
      scoredAt: result.scored_at,
      createdAt: result.created_at,
    }));
  }
}
