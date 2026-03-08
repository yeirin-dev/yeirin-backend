import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

@Injectable()
export class OpenAIClient {
  private readonly logger = new Logger(OpenAIClient.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';

    this.client = axios.create({
      baseURL: 'https://api.openai.com/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (this.apiKey) {
      this.logger.log('OpenAI Client initialized');
    } else {
      this.logger.warn('OpenAI API key not configured - recommendation reasons will use fallback');
    }
  }

  /**
   * 바우처 기관 추천 사유 생성
   */
  async generateRecommendationReasons(
    childInfo: {
      name: string;
      age: number;
      gender: string;
      specialNeeds?: string | null;
      medicalInfo?: string | null;
      counselRequestSummary?: string;
    },
    institutions: Array<{
      id: string;
      name: string;
      type: 'B_IMPACT' | 'COMMON';
      services?: string[];
      targetConditions?: string[];
      voucherTypes?: string[];
    }>,
  ): Promise<Map<string, string>> {
    const result = new Map<string, string>();

    if (!this.apiKey || institutions.length === 0) {
      for (const inst of institutions) {
        result.set(inst.id, `${inst.name}은(는) 같은 지역의 바우처 기관으로 추천됩니다.`);
      }
      return result;
    }

    try {
      const institutionDescriptions = institutions
        .map((inst, idx) => {
          const details: string[] = [`${idx + 1}. ${inst.name} (${inst.type})`];
          if (inst.services?.length) details.push(`   서비스: ${inst.services.join(', ')}`);
          if (inst.targetConditions?.length)
            details.push(`   대상: ${inst.targetConditions.join(', ')}`);
          if (inst.voucherTypes?.length)
            details.push(`   바우처 유형: ${inst.voucherTypes.join(', ')}`);
          return details.join('\n');
        })
        .join('\n');

      const childDescription = [
        `이름: ${childInfo.name}`,
        `나이: ${childInfo.age}세`,
        `성별: ${childInfo.gender === 'MALE' ? '남' : childInfo.gender === 'FEMALE' ? '여' : '기타'}`,
        childInfo.specialNeeds ? `특수 요구: ${childInfo.specialNeeds}` : null,
        childInfo.medicalInfo ? `의료 정보: ${childInfo.medicalInfo}` : null,
        childInfo.counselRequestSummary
          ? `상담 요약: ${childInfo.counselRequestSummary}`
          : null,
      ]
        .filter(Boolean)
        .join('\n');

      const messages: OpenAIChatMessage[] = [
        {
          role: 'system',
          content: `당신은 아동 심리상담 분야의 전문가이자 바우처 기관 매칭 컨설턴트입니다.
아동의 정보(나이, 성별, 특수 요구, 의료 정보, 상담 동기)와 바우처 기관의 정보(서비스, 대상, 바우처 유형)를 종합적으로 분석하여, 각 기관이 해당 아동에게 왜 적합한지를 구체적이고 상세하게 설명해 주세요.

추천 사유 작성 가이드:
1. 아동의 구체적 상황(나이, 특수 요구, 상담 동기 등)과 기관의 서비스/전문성이 어떻게 맞는지를 명확히 연결하세요.
2. 해당 기관만의 강점이나 차별점을 구체적으로 언급하세요(예: 특수 치료 프로그램, 전문 자격, 대상 조건 등).
3. 보호자가 이 기관을 선택했을 때 아동에게 어떤 도움이 될 수 있는지 기대 효과를 포함하세요.
4. 각 추천 사유는 3~4문장으로 충분히 상세하게 작성하세요.

응답은 반드시 JSON 형식으로, 기관 번호를 키로 사용하세요.
예시: {"1": "구체적이고 상세한 추천 사유 3-4문장...", "2": "구체적이고 상세한 추천 사유 3-4문장..."}`,
        },
        {
          role: 'user',
          content: `아동 정보:\n${childDescription}\n\n바우처 기관 목록:\n${institutionDescriptions}`,
        },
      ];

      const response = await this.client.post<OpenAIChatCompletionResponse>(
        '/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
        },
      );

      const rawContent = response.data.choices[0]?.message?.content;
      if (rawContent) {
        // 마크다운 코드블록 제거 (```json ... ```)
        const content = rawContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const parsed = JSON.parse(content) as Record<string, string>;
        institutions.forEach((inst, idx) => {
          const reason = parsed[String(idx + 1)];
          result.set(inst.id, reason || `${inst.name}은(는) 같은 지역의 바우처 기관으로 추천됩니다.`);
        });
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `OpenAI 추천 사유 생성 실패 - status: ${error.response?.status}, message: ${error.message}, data: ${JSON.stringify(error.response?.data)}`,
        );
      } else {
        this.logger.error(
          `OpenAI 추천 사유 생성 실패 - ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      for (const inst of institutions) {
        result.set(inst.id, `${inst.name}은(는) 같은 지역의 바우처 기관으로 추천됩니다.`);
      }
    }

    return result;
  }
}
