import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  UpdatePsychologicalStatusDto,
  UpdatePsychologicalStatusResponseDto,
} from '@application/webhook/dto/update-psychological-status.dto';
import { UpdatePsychologicalStatusUseCase } from '@application/webhook/use-cases/update-psychological-status/update-psychological-status.use-case';
import { Public } from '@infrastructure/auth/decorators/public.decorator';

/**
 * Soul-E Webhook Controller
 *
 * Soul-E 챗봇에서 위험 징후를 감지하면 이 API를 호출하여
 * 아동의 심리 상태를 업데이트합니다.
 *
 * 인증: MSA 내부 통신용 Shared Secret 사용
 */
@ApiTags('Webhook (Soul-E)')
@Controller('api/v1/webhook/soul-e')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly updatePsychologicalStatusUseCase: UpdatePsychologicalStatusUseCase,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Webhook 인증 검증
   * Soul-E에서 전달한 X-Soul-E-Secret 헤더와 서버의 Secret 비교
   */
  private validateWebhookSecret(providedSecret: string | undefined): void {
    const expectedSecret = this.configService.get<string>('SOUL_E_WEBHOOK_SECRET');

    // 개발 환경에서는 Secret 검증 생략 가능
    if (!expectedSecret && this.configService.get<string>('NODE_ENV') === 'development') {
      this.logger.warn(
        '[Webhook] SOUL_E_WEBHOOK_SECRET not configured, skipping validation in development',
      );
      return;
    }

    if (!providedSecret || providedSecret !== expectedSecret) {
      this.logger.warn('[Webhook] Invalid or missing X-Soul-E-Secret header');
      throw new UnauthorizedException('Invalid webhook secret');
    }
  }

  @Public()
  @Post('psychological-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '아동 심리 상태 업데이트 (Soul-E Webhook)',
    description: `
## 설명
Soul-E 챗봇에서 대화 중 위험 징후를 감지하면 이 API를 호출하여
아동의 심리 상태를 업데이트합니다.

## 인증
- **Header**: \`X-Soul-E-Secret: {webhook_secret}\`
- MSA 내부 통신용 Shared Secret 사용

## 상태 종류
- **NORMAL**: 일반 (정상 상태)
- **AT_RISK**: 위험 (관심 필요)
- **HIGH_RISK**: 고위험 (즉시 개입 필요)

## 동작
1. 아동의 현재 심리 상태를 조회
2. 새로운 상태로 업데이트
3. 상태 변경 로그 기록 (audit trail)
4. 위험도 상승 시 알림 (로깅)

## 호출 예시 (Soul-E에서)
\`\`\`python
import httpx

response = await httpx.post(
    f"{YEIRIN_BACKEND_URL}/api/v1/webhook/soul-e/psychological-status",
    headers={"X-Soul-E-Secret": WEBHOOK_SECRET},
    json={
        "childId": "550e8400-e29b-41d4-a716-446655440000",
        "newStatus": "AT_RISK",
        "reason": "대화 중 자해 관련 키워드 감지",
        "sessionId": "660e8400-e29b-41d4-a716-446655440001",
        "metadata": {
            "detectedKeywords": ["힘들어", "살고 싶지 않아"],
            "confidenceScore": 0.85
        }
    }
)
\`\`\`
`,
  })
  @ApiHeader({
    name: 'X-Soul-E-Secret',
    description: 'Soul-E Webhook 인증 Secret',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '심리 상태 업데이트 성공',
    type: UpdatePsychologicalStatusResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Webhook 인증 실패',
    content: {
      'application/json': {
        example: { message: 'Invalid webhook secret', statusCode: 401 },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '아동을 찾을 수 없음',
    content: {
      'application/json': {
        example: { message: '아동을 찾을 수 없습니다: {childId}', statusCode: 404 },
      },
    },
  })
  async updatePsychologicalStatus(
    @Headers('X-Soul-E-Secret') webhookSecret: string | undefined,
    @Body() dto: UpdatePsychologicalStatusDto,
  ): Promise<UpdatePsychologicalStatusResponseDto> {
    // 1. Webhook 인증 검증
    this.validateWebhookSecret(webhookSecret);

    // 2. 로깅
    this.logger.log(
      `[Webhook] Received psychological status update - childId: ${dto.childId}, newStatus: ${dto.newStatus}`,
    );

    // 3. UseCase 실행
    return await this.updatePsychologicalStatusUseCase.execute(dto);
  }
}
