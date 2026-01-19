import { Injectable, Logger } from '@nestjs/common';
import {
  ChildAssessmentSummary,
  KprcTScores,
  SoulEClient,
} from '@infrastructure/external/soul-e.client';
import {
  AssessmentStatusDto,
  CriteriaResultDto,
  CriteriaResultsDto,
  VoucherEligibilityResponseDto,
} from '../../dto/voucher-eligibility.dto';

/**
 * 바우처 추천 대상 판별 조건
 *
 * 필수 조건: CRTES-R, SDQ-A, KPRC 중 하나라도 수행
 *
 * 추천 조건 (3가지 중 1가지 이상 충족):
 * 1. CRTES-R: 중증도군(level 2) 또는 중증군(level 3)
 * 2. SDQ-A: 강점 또는 난점 중 경계선(level 2) 또는 위험군(level 3)
 * 3. KPRC: ERS ≤30T 또는 나머지 10개 척도 중 하나라도 ≥65T (ICN, F 제외)
 */
@Injectable()
export class CheckVoucherEligibilityUseCase {
  private readonly logger = new Logger(CheckVoucherEligibilityUseCase.name);

  // KPRC 위험 기준
  private readonly ERS_RISK_THRESHOLD = 30; // ERS는 ≤30T가 위험
  private readonly OTHER_SCALE_RISK_THRESHOLD = 65; // 나머지는 ≥65T가 위험

  constructor(private readonly soulEClient: SoulEClient) {}

  /**
   * 아동의 바우처 추천 대상 여부를 판별합니다.
   */
  async execute(childId: string): Promise<VoucherEligibilityResponseDto> {
    this.logger.log(`바우처 추천 대상 판별 시작 - childId: ${childId}`);

    // Soul-E에서 아동 검사 요약 조회
    const summary = await this.soulEClient.getChildAssessmentSummary(childId);

    if (!summary) {
      this.logger.log(`검사 결과 없음 - childId: ${childId}`);
      return this.createEmptyResponse(childId);
    }

    // 검사 완료 현황 생성
    const assessmentStatus = this.buildAssessmentStatus(summary);

    // 검사가 하나도 없는 경우
    const hasAnyAssessment = summary.has_crtes_r || summary.has_sdq_a || summary.has_kprc;
    if (!hasAnyAssessment) {
      this.logger.log(
        `검사 결과 없음 - childId: ${childId}, ` +
          `CRTES-R: ${summary.has_crtes_r}, SDQ-A: ${summary.has_sdq_a}, KPRC: ${summary.has_kprc}`,
      );
      return {
        childId,
        isEligible: false,
        hasAllRequiredAssessments: false,
        assessmentStatus,
      };
    }

    // 각 조건별 판별
    const criteriaResults = this.evaluateCriteria(summary);
    const eligibilityReasons: string[] = [];

    if (criteriaResults.crtesR?.met) {
      eligibilityReasons.push(criteriaResults.crtesR.description);
    }
    if (criteriaResults.sdqA?.met) {
      eligibilityReasons.push(criteriaResults.sdqA.description);
    }
    if (criteriaResults.kprc?.met) {
      eligibilityReasons.push(criteriaResults.kprc.description);
    }

    const metCriteriaCount = eligibilityReasons.length;
    const isEligible = metCriteriaCount > 0;

    this.logger.log(
      `바우처 추천 대상 판별 완료 - childId: ${childId}, ` +
        `isEligible: ${isEligible}, metCriteriaCount: ${metCriteriaCount}`,
    );

    return {
      childId,
      isEligible,
      hasAllRequiredAssessments: true,
      assessmentStatus,
      criteriaResults,
      metCriteriaCount,
      eligibilityReasons: eligibilityReasons.length > 0 ? eligibilityReasons : undefined,
    };
  }

  /**
   * 검사 완료 현황 빌드
   */
  private buildAssessmentStatus(summary: ChildAssessmentSummary): AssessmentStatusDto {
    const hasKprcTScores =
      summary.has_kprc &&
      summary.kprc?.t_score_extraction_status === 'COMPLETED' &&
      summary.kprc?.t_scores !== null;

    return {
      hasCrtesR: summary.has_crtes_r,
      hasSdqA: summary.has_sdq_a,
      hasKprc: summary.has_kprc,
      hasKprcTScores,
    };
  }

  /**
   * 3가지 조건 판별
   */
  private evaluateCriteria(summary: ChildAssessmentSummary): CriteriaResultsDto {
    return {
      crtesR: this.evaluateCrtesR(summary),
      sdqA: this.evaluateSdqA(summary),
      kprc: this.evaluateKprc(summary),
    };
  }

  /**
   * CRTES-R 조건 판별
   * 중증도군(level 2) 또는 중증군(level 3) 해당 시 충족
   *
   * CRTES-R 레벨 기준:
   * - Level 1 (경증군): 0-22점 → 정상 범위
   * - Level 2 (중증도군): 23-43점 → 바우처 대상
   * - Level 3 (중증군): 44점 이상 → 바우처 대상
   */
  private evaluateCrtesR(summary: ChildAssessmentSummary): CriteriaResultDto {
    const crtesR = summary.crtes_r;

    if (!crtesR || crtesR.severity_level === null) {
      return {
        met: false,
        description: 'CRTES-R 결과 없음 또는 심각도 레벨 미확인',
      };
    }

    const severityLevel = crtesR.severity_level;
    const isRisk = severityLevel >= 2; // 2: 중증도군, 3: 중증군

    // 점수 문자열 생성 (점수가 있는 경우만)
    const scoreText = crtesR.total_score !== null ? ` (${crtesR.total_score}/115점)` : '';
    const levelLabel = crtesR.severity_label || `레벨 ${severityLevel}`;

    return {
      met: isRisk,
      description: isRisk
        ? `CRTES-R ${levelLabel}${scoreText} 해당`
        : `CRTES-R ${levelLabel}${scoreText}`,
      details: {
        severity_level: severityLevel,
        severity_label: crtesR.severity_label,
        total_score: crtesR.total_score,
      },
    };
  }

  /**
   * SDQ-A 조건 판별
   * 강점 또는 난점 중 경계선(level 2) 또는 위험군(level 3) 해당 시 충족
   */
  private evaluateSdqA(summary: ChildAssessmentSummary): CriteriaResultDto {
    const sdqA = summary.sdq_a;

    if (!sdqA) {
      return {
        met: false,
        description: 'SDQ-A 결과 없음',
      };
    }

    const strengthLevel = sdqA.strength_level;
    const difficultyLevel = sdqA.difficulty_level;

    // 강점 또는 난점이 2(경계선) 또는 3(위험군)인 경우
    const isStrengthRisk = strengthLevel !== null && strengthLevel >= 2;
    const isDifficultyRisk = difficultyLevel !== null && difficultyLevel >= 2;
    const isRisk = isStrengthRisk || isDifficultyRisk;

    const reasons: string[] = [];
    if (isStrengthRisk) {
      reasons.push(`강점 ${this.getSdqLevelLabel(strengthLevel)}`);
    }
    if (isDifficultyRisk) {
      reasons.push(`난점 ${this.getSdqLevelLabel(difficultyLevel)}`);
    }

    return {
      met: isRisk,
      description: isRisk ? `SDQ-A ${reasons.join(', ')} 해당` : 'SDQ-A 정상 범위',
      details: {
        strength_level: strengthLevel,
        difficulty_level: difficultyLevel,
        total_score: sdqA.total_score,
      },
    };
  }

  /**
   * KPRC 조건 판별
   * ERS ≤30T 또는 나머지 10개 척도 중 하나라도 ≥65T 해당 시 충족
   * (ICN, F 척도는 타당도 척도로 바우처 판별에서 제외)
   */
  private evaluateKprc(summary: ChildAssessmentSummary): CriteriaResultDto {
    const kprc = summary.kprc;

    if (!kprc) {
      return {
        met: false,
        description: 'KPRC 결과 없음',
      };
    }

    // T점수 추출이 아직 완료되지 않은 경우
    if (kprc.t_score_extraction_status !== 'COMPLETED' || !kprc.t_scores) {
      return {
        met: false,
        description: `KPRC T점수 추출 ${this.getExtractionStatusLabel(kprc.t_score_extraction_status)}`,
        details: {
          extraction_status: kprc.t_score_extraction_status,
        },
      };
    }

    const tScores = kprc.t_scores;
    const riskScales = this.findKprcRiskScales(tScores);

    const isRisk = riskScales.length > 0;

    return {
      met: isRisk,
      description: isRisk
        ? `KPRC 위험 척도 감지: ${riskScales.map((s) => s.name).join(', ')}`
        : 'KPRC 모든 척도 정상 범위',
      details: {
        risk_scales: riskScales,
        t_scores: tScores,
        meets_voucher_criteria: kprc.meets_voucher_criteria,
      },
    };
  }

  /**
   * KPRC 위험 척도 탐지
   * ERS: ≤30T가 위험 (낮을수록 위험)
   * 나머지 10개: ≥65T가 위험 (ICN, F 제외 - 타당도 척도)
   */
  private findKprcRiskScales(tScores: KprcTScores): Array<{ name: string; value: number }> {
    const riskScales: Array<{ name: string; value: number }> = [];

    // ERS (자아탄력성): ≤30T가 위험
    if (tScores.ers_t_score !== null && tScores.ers_t_score <= this.ERS_RISK_THRESHOLD) {
      riskScales.push({ name: 'ERS(자아탄력성)', value: tScores.ers_t_score });
    }

    // 나머지 10개 척도: ≥65T가 위험 (ICN, F 제외 - 타당도 척도)
    const otherScales: Array<{ key: keyof KprcTScores; name: string }> = [
      // ICN(비일관성), F(저빈도)는 타당도 척도로 바우처 판별에서 제외
      { key: 'vdl_t_score', name: 'VDL(긍정왜곡)' },
      { key: 'pdl_t_score', name: 'PDL(부정왜곡)' },
      { key: 'anx_t_score', name: 'ANX(불안)' },
      { key: 'dep_t_score', name: 'DEP(우울)' },
      { key: 'som_t_score', name: 'SOM(신체화)' },
      { key: 'dlq_t_score', name: 'DLQ(비행)' },
      { key: 'hpr_t_score', name: 'HPR(과잉행동)' },
      { key: 'fam_t_score', name: 'FAM(가족관계)' },
      { key: 'soc_t_score', name: 'SOC(사회관계)' },
      { key: 'psy_t_score', name: 'PSY(정신증)' },
    ];

    for (const scale of otherScales) {
      const value = tScores[scale.key];
      if (value !== null && value >= this.OTHER_SCALE_RISK_THRESHOLD) {
        riskScales.push({ name: scale.name, value });
      }
    }

    return riskScales;
  }

  /**
   * SDQ 레벨 라벨 반환
   */
  private getSdqLevelLabel(level: number | null): string {
    if (level === null) return '미확인';
    switch (level) {
      case 1:
        return '정상';
      case 2:
        return '경계선';
      case 3:
        return '위험군';
      default:
        return `레벨 ${level}`;
    }
  }

  /**
   * T점수 추출 상태 라벨 반환
   */
  private getExtractionStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: '대기 중',
      PROCESSING: '처리 중',
      COMPLETED: '완료',
      FAILED: '실패',
      NOT_REQUESTED: '요청되지 않음',
    };
    return labels[status] || status;
  }

  /**
   * 검사 결과가 없는 경우의 응답
   */
  private createEmptyResponse(childId: string): VoucherEligibilityResponseDto {
    return {
      childId,
      isEligible: false,
      hasAllRequiredAssessments: false,
      assessmentStatus: {
        hasCrtesR: false,
        hasSdqA: false,
        hasKprc: false,
        hasKprcTScores: false,
      },
    };
  }
}
