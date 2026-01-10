import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AssessmentResultResponseDto } from '@application/counsel-request/dto/assessment-result-response.dto';
import { CounselRequestResponseDto } from '@application/counsel-request/dto/counsel-request-response.dto';
import { CreateCounselRequestDto } from '@application/counsel-request/dto/create-counsel-request.dto';
import { PaginatedResponseDto } from '@application/counsel-request/dto/paginated-response.dto';
import { PaginationQueryDto } from '@application/counsel-request/dto/pagination-query.dto';
import { SouliWebhookDto } from '@application/counsel-request/dto/souli-webhook.dto';
import { UpdateCounselRequestDto } from '@application/counsel-request/dto/update-counsel-request.dto';
import { CompleteCounselingUseCase } from '@application/counsel-request/use-cases/complete-counseling.usecase';
import { CreateCounselRequestFromSouliUseCase } from '@application/counsel-request/use-cases/create-counsel-request-from-souli.usecase';
import { CreateCounselRequestUseCase } from '@application/counsel-request/use-cases/create-counsel-request.usecase';
import { DeleteCounselRequestUseCase } from '@application/counsel-request/use-cases/delete-counsel-request.usecase';
import { GetChildAssessmentResultsUseCase } from '@application/counsel-request/use-cases/get-child-assessment-results.usecase';
import { GetCounselRequestRecommendationsUseCase } from '@application/counsel-request/use-cases/get-counsel-request-recommendations.usecase';
import { GetCounselRequestUseCase } from '@application/counsel-request/use-cases/get-counsel-request.usecase';
import { GetCounselRequestsByChildUseCase } from '@application/counsel-request/use-cases/get-counsel-requests-by-child.usecase';
import { GetCounselRequestsByInstitutionUseCase } from '@application/counsel-request/use-cases/get-counsel-requests-by-institution.usecase';
import { GetCounselRequestsPaginatedUseCase } from '@application/counsel-request/use-cases/get-counsel-requests-paginated.usecase';
import { RequestCounselRequestRecommendationUseCase } from '@application/counsel-request/use-cases/request-counsel-request-recommendation.usecase';
import { SelectRecommendedInstitutionUseCase } from '@application/counsel-request/use-cases/select-recommended-institution.usecase';
import { StartCounselingUseCase } from '@application/counsel-request/use-cases/start-counseling.usecase';
import { UpdateCounselRequestUseCase } from '@application/counsel-request/use-cases/update-counsel-request.usecase';
import {
  CurrentUser,
  CurrentUserData,
} from '@infrastructure/auth/decorators/current-user.decorator';
import { Public } from '@infrastructure/auth/decorators/public.decorator';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';

@ApiTags('상담의뢰지')
@Controller('api/v1/counsel-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CounselRequestController {
  constructor(
    private readonly createCounselRequestUseCase: CreateCounselRequestUseCase,
    private readonly createCounselRequestFromSouliUseCase: CreateCounselRequestFromSouliUseCase,
    private readonly getCounselRequestUseCase: GetCounselRequestUseCase,
    private readonly getCounselRequestsByChildUseCase: GetCounselRequestsByChildUseCase,
    private readonly getCounselRequestsByInstitutionUseCase: GetCounselRequestsByInstitutionUseCase,
    private readonly getCounselRequestsPaginatedUseCase: GetCounselRequestsPaginatedUseCase,
    private readonly updateCounselRequestUseCase: UpdateCounselRequestUseCase,
    private readonly deleteCounselRequestUseCase: DeleteCounselRequestUseCase,
    private readonly requestRecommendationUseCase: RequestCounselRequestRecommendationUseCase,
    private readonly getRecommendationsUseCase: GetCounselRequestRecommendationsUseCase,
    private readonly selectInstitutionUseCase: SelectRecommendedInstitutionUseCase,
    private readonly startCounselingUseCase: StartCounselingUseCase,
    private readonly completeCounselingUseCase: CompleteCounselingUseCase,
    private readonly getChildAssessmentResultsUseCase: GetChildAssessmentResultsUseCase,
  ) {}

  @Public()
  @Post('webhook/souli')
  @ApiOperation({ summary: '소울이 연동 - 상담의뢰지 자동 생성 (인증 불필요)' })
  @ApiResponse({
    status: 201,
    description: '소울이 연동 성공, 상담의뢰지 생성됨',
    type: CounselRequestResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 (유효성 검증 실패)' })
  async createCounselRequestFromSouli(
    @Body() dto: SouliWebhookDto,
  ): Promise<CounselRequestResponseDto> {
    return await this.createCounselRequestFromSouliUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: '내 시설 상담의뢰지 목록 조회 (페이지네이션 + 필터)' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호 (1부터 시작)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수', example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    description: '상태별 필터',
    enum: ['PENDING', 'MATCHED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'],
  })
  @ApiResponse({
    status: 200,
    description: '조회 성공 (본인 시설의 아동 상담의뢰지만 반환)',
    type: PaginatedResponseDto<CounselRequestResponseDto>,
  })
  async getCounselRequests(
    @CurrentUser() user: CurrentUserData,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<CounselRequestResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    return await this.getCounselRequestsByInstitutionUseCase.execute(
      user.institutionId,
      user.facilityType,
      page,
      limit,
      query.status,
    );
  }

  @Post()
  @ApiOperation({ summary: '상담의뢰지 생성 (보호자 직접 작성)' })
  @ApiResponse({
    status: 201,
    description: '상담의뢰지 생성 성공',
    type: CounselRequestResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 (유효성 검증 실패)' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async createCounselRequest(
    @Body() dto: CreateCounselRequestDto,
  ): Promise<CounselRequestResponseDto> {
    return await this.createCounselRequestUseCase.execute(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '상담의뢰지 단건 조회' })
  @ApiParam({ name: 'id', description: '상담의뢰지 ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: CounselRequestResponseDto,
  })
  @ApiResponse({ status: 403, description: '권한 없음 (다른 시설의 상담의뢰지)' })
  @ApiResponse({ status: 404, description: '상담의뢰지를 찾을 수 없음' })
  async getCounselRequest(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ): Promise<CounselRequestResponseDto> {
    return await this.getCounselRequestUseCase.execute(id, {
      institutionId: user.institutionId,
      facilityType: user.facilityType,
    });
  }

  @Get('child/:childId')
  @ApiOperation({ summary: '아동 ID로 상담의뢰지 목록 조회' })
  @ApiParam({ name: 'childId', description: '아동 ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: [CounselRequestResponseDto],
  })
  @ApiResponse({ status: 403, description: '권한 없음 (다른 시설의 아동)' })
  async getCounselRequestsByChild(
    @CurrentUser() user: CurrentUserData,
    @Param('childId') childId: string,
  ): Promise<CounselRequestResponseDto[]> {
    return await this.getCounselRequestsByChildUseCase.execute(childId, {
      institutionId: user.institutionId,
      facilityType: user.facilityType,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: '상담의뢰지 수정 (접수 대기 상태에서만 가능)' })
  @ApiParam({ name: 'id', description: '상담의뢰지 ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: '수정 성공',
    type: CounselRequestResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 또는 상태 오류' })
  @ApiResponse({ status: 404, description: '상담의뢰지를 찾을 수 없음' })
  async updateCounselRequest(
    @Param('id') id: string,
    @Body() dto: UpdateCounselRequestDto,
  ): Promise<CounselRequestResponseDto> {
    return await this.updateCounselRequestUseCase.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '상담의뢰지 삭제' })
  @ApiParam({ name: 'id', description: '상담의뢰지 ID (UUID)' })
  @ApiResponse({ status: 204, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '상담의뢰지를 찾을 수 없음' })
  async deleteCounselRequest(@Param('id') id: string): Promise<void> {
    return await this.deleteCounselRequestUseCase.execute(id);
  }

  @Post(':id/request-recommendation')
  @ApiOperation({ summary: 'AI 기반 바우처 기관 추천 요청 (5개)' })
  @ApiParam({ name: 'id', description: '상담의뢰지 ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'AI 추천 성공 (상태 → RECOMMENDED)',
    schema: {
      properties: {
        counselRequestId: { type: 'string' },
        recommendations: {
          type: 'array',
          items: {
            properties: {
              id: { type: 'string' },
              institutionId: { type: 'string' },
              score: { type: 'number' },
              reason: { type: 'string' },
              rank: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'PENDING 상태가 아니거나 정보 불충분' })
  @ApiResponse({ status: 404, description: '상담의뢰지를 찾을 수 없음' })
  @ApiResponse({ status: 500, description: 'AI 서비스 오류' })
  async requestRecommendation(@Param('id') id: string) {
    return await this.requestRecommendationUseCase.execute(id);
  }

  @Get(':id/recommendations')
  @ApiOperation({ summary: '상담의뢰지 추천 목록 조회 (rank 순)' })
  @ApiParam({ name: 'id', description: '상담의뢰지 ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: '추천 목록 조회 성공',
    schema: {
      type: 'array',
      items: {
        properties: {
          id: { type: 'string' },
          institutionId: { type: 'string' },
          score: { type: 'number' },
          reason: { type: 'string' },
          rank: { type: 'number' },
          selected: { type: 'boolean' },
          isHighScore: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: '상담의뢰지를 찾을 수 없음' })
  async getRecommendations(@Param('id') id: string) {
    return await this.getRecommendationsUseCase.execute(id);
  }

  @Post(':id/select-institution')
  @ApiOperation({ summary: '추천된 기관 중 하나 선택 (Accept)' })
  @ApiParam({ name: 'id', description: '상담의뢰지 ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: '기관 선택 성공 (상태 → MATCHED)',
    type: CounselRequestResponseDto,
  })
  @ApiResponse({ status: 400, description: 'RECOMMENDED 상태가 아니거나 잘못된 기관 ID' })
  @ApiResponse({ status: 404, description: '상담의뢰지를 찾을 수 없음' })
  async selectInstitution(
    @Param('id') id: string,
    @Body() dto: { institutionId: string },
  ): Promise<CounselRequestResponseDto> {
    return await this.selectInstitutionUseCase.execute(id, dto.institutionId);
  }

  @Post(':id/start')
  @ApiOperation({ summary: '상담 시작 (매칭 완료 상태에서만 가능)' })
  @ApiParam({ name: 'id', description: '상담의뢰지 ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: '상담 시작 성공',
    type: CounselRequestResponseDto,
  })
  @ApiResponse({ status: 400, description: '상태 오류' })
  @ApiResponse({ status: 404, description: '상담의뢰지를 찾을 수 없음' })
  async startCounseling(@Param('id') id: string): Promise<CounselRequestResponseDto> {
    return await this.startCounselingUseCase.execute(id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '상담 완료 (상담 진행 중 상태에서만 가능)' })
  @ApiParam({ name: 'id', description: '상담의뢰지 ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: '상담 완료 성공',
    type: CounselRequestResponseDto,
  })
  @ApiResponse({ status: 400, description: '상태 오류' })
  @ApiResponse({ status: 404, description: '상담의뢰지를 찾을 수 없음' })
  async completeCounseling(@Param('id') id: string): Promise<CounselRequestResponseDto> {
    return await this.completeCounselingUseCase.execute(id);
  }

  @Get('assessment-results/child/:childId')
  @ApiOperation({
    summary: '아동의 Soul-E 심리검사 결과 목록 조회',
    description:
      '아동 ID로 Soul-E MSA에서 완료된 심리검사 결과 목록을 조회합니다. 상담의뢰지 작성 시 검사 결과 PDF를 첨부하기 위해 사용됩니다.',
  })
  @ApiParam({ name: 'childId', description: '아동 ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: [AssessmentResultResponseDto],
  })
  @ApiResponse({ status: 500, description: 'Soul-E 서비스 오류' })
  async getChildAssessmentResults(
    @Param('childId') childId: string,
  ): Promise<AssessmentResultResponseDto[]> {
    return await this.getChildAssessmentResultsUseCase.execute(childId);
  }
}
