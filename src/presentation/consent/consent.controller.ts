import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AcceptConsentDto } from '@application/consent/dto/accept-consent.dto';
import { ConsentResponseDto, ConsentStatusResponseDto } from '@application/consent/dto/consent-response.dto';
import { RevokeConsentDto } from '@application/consent/dto/revoke-consent.dto';
import { AcceptConsentUseCase } from '@application/consent/use-cases/accept-consent.use-case';
import { GetConsentStatusUseCase } from '@application/consent/use-cases/get-consent-status.use-case';
import { RevokeConsentUseCase } from '@application/consent/use-cases/revoke-consent.use-case';
import { Public } from '@infrastructure/auth/decorators/public.decorator';

/**
 * 동의서 관리 Controller
 *
 * Soul-E에서 호출하는 MSA 내부 API
 * - X-Internal-Secret 헤더로 인증
 */
@ApiTags('동의서 관리 (Internal)')
@Controller('api/v1/consent')
export class ConsentController {
  private readonly logger = new Logger(ConsentController.name);

  constructor(
    private readonly acceptConsentUseCase: AcceptConsentUseCase,
    private readonly getConsentStatusUseCase: GetConsentStatusUseCase,
    private readonly revokeConsentUseCase: RevokeConsentUseCase,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 내부 API 인증 검증
   */
  private validateInternalSecret(providedSecret: string | undefined): void {
    const expectedSecret = this.configService.get<string>('INTERNAL_API_SECRET');

    // 개발 환경에서는 Secret 검증 생략 가능
    if (!expectedSecret && this.configService.get<string>('NODE_ENV') === 'development') {
      this.logger.warn(
        '[Consent] INTERNAL_API_SECRET not configured, skipping validation in development',
      );
      return;
    }

    if (!providedSecret || providedSecret !== expectedSecret) {
      this.logger.warn('[Consent] Invalid or missing X-Internal-Secret header');
      throw new UnauthorizedException('Invalid internal API secret');
    }
  }

  /**
   * 클라이언트 IP 추출
   */
  private getClientIp(req: Request): string | undefined {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip;
  }

  @Public()
  @Get('status/:childId')
  @ApiOperation({
    summary: '아동 동의 상태 조회',
    description: `
## 설명
아동의 개인정보 처리 동의 상태를 조회합니다.

## 인증
- **Header**: \`X-Internal-Secret: {internal_api_secret}\`
- MSA 내부 통신용 Shared Secret 사용

## 응답
- **hasConsent**: 동의 여부
- **consentItems**: 동의 항목 (동의가 없으면 null)
- **consentVersion**: 동의서 버전 (동의가 없으면 null)
- **consentedAt**: 동의 시각 (동의가 없으면 null)
- **isValid**: 유효한 동의 여부 (철회되지 않고 필수 항목 동의됨)
    `,
  })
  @ApiHeader({
    name: 'X-Internal-Secret',
    description: '내부 API 인증 Secret',
    required: true,
  })
  @ApiParam({
    name: 'childId',
    description: '아동 ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: '동의 상태 조회 성공',
    type: ConsentStatusResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  async getConsentStatus(
    @Headers('X-Internal-Secret') internalSecret: string | undefined,
    @Param('childId') childId: string,
  ): Promise<ConsentStatusResponseDto> {
    // 1. 내부 API 인증
    this.validateInternalSecret(internalSecret);

    // 2. UseCase 실행
    const result = await this.getConsentStatusUseCase.execute(childId);

    if (result.isFailure) {
      throw new BadRequestException(result.getError().message);
    }

    return result.getValue();
  }

  @Public()
  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '동의 제출',
    description: `
## 설명
아동의 개인정보 처리 동의를 저장합니다.
- 새 동의 생성 또는 기존 동의 업데이트
- 동의 이력 자동 기록

## 인증
- **Header**: \`X-Internal-Secret: {internal_api_secret}\`
- MSA 내부 통신용 Shared Secret 사용

## 필수 동의 항목
- **personalInfo**: 개인정보 수집·이용 및 제3자 제공 동의 (필수)
- **sensitiveData**: 민감정보 처리 동의 (필수)
- **childSelfConsent**: 아동 본인 동의 (14세 이상 아동인 경우 필수)

## 선택 동의 항목
- **researchData**: 비식별화 데이터 연구 활용 동의

## 호출 예시 (Soul-E에서)
\`\`\`python
import httpx

response = await httpx.post(
    f"{YEIRIN_BACKEND_URL}/api/v1/consent/accept",
    headers={"X-Internal-Secret": INTERNAL_SECRET},
    json={
        "childId": "550e8400-e29b-41d4-a716-446655440000",
        "consentItems": {
            "personalInfo": True,
            "sensitiveData": True,
            "researchData": False,
            "childSelfConsent": True
        },
        "isChildOver14": True,
        "documentUrl": "/documents/privacy-policy-v1.0.0.pdf"
    }
)
\`\`\`
    `,
  })
  @ApiHeader({
    name: 'X-Internal-Secret',
    description: '내부 API 인증 Secret',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '동의 제출 성공',
    type: ConsentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (필수 동의 항목 누락 등)',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  async acceptConsent(
    @Headers('X-Internal-Secret') internalSecret: string | undefined,
    @Body() dto: AcceptConsentDto,
    @Req() req: Request,
  ): Promise<ConsentResponseDto> {
    // 1. 내부 API 인증
    this.validateInternalSecret(internalSecret);

    // 2. IP 주소 자동 주입
    if (!dto.ipAddress) {
      dto.ipAddress = this.getClientIp(req);
    }

    // 3. UseCase 실행
    const result = await this.acceptConsentUseCase.execute(dto);

    if (result.isFailure) {
      throw new BadRequestException(result.getError().message);
    }

    this.logger.log(`[Consent] Consent accepted - childId: ${dto.childId}`);

    return result.getValue();
  }

  @Public()
  @Post('revoke/:childId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '동의 철회',
    description: `
## 설명
아동의 개인정보 처리 동의를 철회합니다.
- 철회 사유 필수
- 철회 이력 자동 기록

## 인증
- **Header**: \`X-Internal-Secret: {internal_api_secret}\`
- MSA 내부 통신용 Shared Secret 사용
    `,
  })
  @ApiHeader({
    name: 'X-Internal-Secret',
    description: '내부 API 인증 Secret',
    required: true,
  })
  @ApiParam({
    name: 'childId',
    description: '아동 ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: '동의 철회 성공',
    type: ConsentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (이미 철회된 동의 등)',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 404,
    description: '동의 정보를 찾을 수 없음',
  })
  async revokeConsent(
    @Headers('X-Internal-Secret') internalSecret: string | undefined,
    @Param('childId') childId: string,
    @Body() dto: RevokeConsentDto,
    @Req() req: Request,
  ): Promise<ConsentResponseDto> {
    // 1. 내부 API 인증
    this.validateInternalSecret(internalSecret);

    // 2. IP 주소 자동 주입
    if (!dto.ipAddress) {
      dto.ipAddress = this.getClientIp(req);
    }

    // 3. UseCase 실행
    const result = await this.revokeConsentUseCase.execute(childId, dto);

    if (result.isFailure) {
      const error = result.getError();
      if (error.code === 'CONSENT_NOT_FOUND') {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(error.message);
    }

    this.logger.log(`[Consent] Consent revoked - childId: ${childId}`);

    return result.getValue();
  }
}
