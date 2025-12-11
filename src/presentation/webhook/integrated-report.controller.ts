import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { Public } from '@infrastructure/auth/decorators/public.decorator';

/**
 * 통합 보고서 완료 Webhook DTO
 */
export class IntegratedReportCompleteDto {
  @IsString()
  counsel_request_id: string;

  @IsString()
  @IsOptional()
  integrated_report_s3_key?: string;

  @IsString()
  @IsIn(['completed', 'failed'])
  status: 'completed' | 'failed';

  @IsString()
  @IsOptional()
  error_message?: string;
}

/**
 * Webhook 응답 DTO
 */
export class IntegratedReportWebhookResponse {
  success: boolean;
  message: string;
}

/**
 * 통합 보고서 Webhook Controller
 *
 * yeirin-ai에서 통합 보고서 생성이 완료되면 이 API를 호출하여
 * counsel_requests 테이블을 업데이트합니다.
 *
 * 인증: MSA 내부 통신용 Shared Secret 사용
 */
@ApiTags('Webhook (Yeirin-AI)')
@Controller('api/v1/webhook')
export class IntegratedReportWebhookController {
  private readonly logger = new Logger(IntegratedReportWebhookController.name);

  constructor(
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 내부 API 키 검증
   */
  private validateInternalApiKey(apiKey: string | undefined): void {
    const expectedKey = this.configService.get<string>('INTERNAL_API_SECRET');

    // 개발 환경에서는 검증 생략 가능
    if (!expectedKey && this.configService.get<string>('NODE_ENV') === 'development') {
      this.logger.warn('[Webhook] INTERNAL_API_SECRET not configured, skipping validation');
      return;
    }

    if (!apiKey || apiKey !== expectedKey) {
      this.logger.warn('[Webhook] Invalid or missing X-Internal-Api-Key header');
      throw new UnauthorizedException('Invalid internal API key');
    }
  }

  @Public()
  @Post('integrated-report-complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '통합 보고서 생성 완료 (Yeirin-AI Webhook)',
    description: `
## 설명
yeirin-ai에서 통합 보고서 생성이 완료되면 이 API를 호출하여
counsel_requests 테이블의 integrated_report_s3_key와 integrated_report_status를 업데이트합니다.

## 인증
- **Header**: \`X-Internal-Api-Key: {internal_api_secret}\`
- MSA 내부 통신용 Shared Secret 사용

## 동작
1. counsel_request_id로 상담의뢰지 조회
2. integrated_report_s3_key, integrated_report_status 업데이트
3. 저장

## 호출 예시 (yeirin-ai에서)
\`\`\`python
async with httpx.AsyncClient() as client:
    await client.post(
        f"{YEIRIN_BACKEND_URL}/api/v1/webhook/integrated-report-complete",
        headers={"X-Internal-Api-Key": INTERNAL_API_SECRET},
        json={
            "counsel_request_id": "550e8400-e29b-41d4-a716-446655440000",
            "integrated_report_s3_key": "integrated-reports/IR_홍길동_abc123.pdf",
            "status": "completed"
        }
    )
\`\`\`
`,
  })
  @ApiHeader({
    name: 'X-Internal-Api-Key',
    description: '내부 서비스 API 키',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '통합 보고서 상태 업데이트 성공',
    type: IntegratedReportWebhookResponse,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 404,
    description: '상담의뢰지를 찾을 수 없음',
  })
  async handleIntegratedReportComplete(
    @Headers('X-Internal-Api-Key') apiKey: string | undefined,
    @Body() dto: IntegratedReportCompleteDto,
  ): Promise<IntegratedReportWebhookResponse> {
    // 1. 인증 검증
    this.validateInternalApiKey(apiKey);

    // 2. 로깅
    this.logger.log(
      `[Webhook] Received integrated report complete - counselRequestId: ${dto.counsel_request_id}, status: ${dto.status}`,
    );

    // 3. 상담의뢰지 조회
    const counselRequest = await this.counselRequestRepository.findById(dto.counsel_request_id);
    if (!counselRequest) {
      this.logger.warn(
        `[Webhook] Counsel request not found - counselRequestId: ${dto.counsel_request_id}`,
      );
      return {
        success: false,
        message: `상담의뢰지를 찾을 수 없습니다: ${dto.counsel_request_id}`,
      };
    }

    // 4. 상태 업데이트
    const updateResult = counselRequest.updateIntegratedReportStatus(
      dto.status,
      dto.integrated_report_s3_key,
    );

    if (updateResult.isFailure) {
      this.logger.warn(
        `[Webhook] Failed to update integrated report status - ${updateResult.getError().message}`,
      );
      return {
        success: false,
        message: updateResult.getError().message,
      };
    }

    // 5. 저장
    await this.counselRequestRepository.save(counselRequest);

    this.logger.log(
      `[Webhook] Integrated report status updated - counselRequestId: ${dto.counsel_request_id}, status: ${dto.status}, s3Key: ${dto.integrated_report_s3_key || 'N/A'}`,
    );

    return {
      success: true,
      message: '통합 보고서 상태가 업데이트되었습니다',
    };
  }
}
