import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetLinkedChildrenUseCase, LinkedChildItem } from '@application/b-impact-institution/use-cases/get-linked-children.usecase';
import { AcceptLinkageUseCase } from '@application/b-impact-institution/use-cases/accept-linkage.usecase';
import { RejectLinkageUseCase } from '@application/b-impact-institution/use-cases/reject-linkage.usecase';
import { GetChildDetailUseCase } from '@application/b-impact-institution/use-cases/get-child-detail.usecase';
import { GetCounselSessionsUseCase } from '@application/b-impact-institution/use-cases/get-counsel-sessions.usecase';
import { CreateCounselSessionUseCase } from '@application/b-impact-institution/use-cases/create-counsel-session.usecase';
import { UpdateCounselSessionUseCase } from '@application/b-impact-institution/use-cases/update-counsel-session.usecase';
import { CancelCounselSessionUseCase } from '@application/b-impact-institution/use-cases/cancel-counsel-session.usecase';
import { CompleteCounselSessionUseCase } from '@application/b-impact-institution/use-cases/complete-counsel-session.usecase';
import { GetCounselRecordsUseCase } from '@application/b-impact-institution/use-cases/get-counsel-records.usecase';
import { GetCounselRecordUseCase } from '@application/b-impact-institution/use-cases/get-counsel-record.usecase';
import { CreateCounselRecordUseCase } from '@application/b-impact-institution/use-cases/create-counsel-record.usecase';
import { UpdateCounselRecordUseCase } from '@application/b-impact-institution/use-cases/update-counsel-record.usecase';
import { SubmitCounselRecordUseCase } from '@application/b-impact-institution/use-cases/submit-counsel-record.usecase';
import { ShareCounselRecordUseCase } from '@application/b-impact-institution/use-cases/share-counsel-record.usecase';
import { CreateCounselSessionDto, UpdateCounselSessionDto } from '@application/b-impact-institution/dto/counsel-session.dto';
import { CreateCounselRecordDto, UpdateCounselRecordDto } from '@application/b-impact-institution/dto/counsel-record.dto';
import {
  CurrentUser,
  CurrentUserData,
} from '@infrastructure/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';

@ApiTags('B-IMPACT 기관 콘솔')
@Controller('api/v1/b-impact-institution')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BImpactInstitutionController {
  constructor(
    private readonly getLinkedChildrenUseCase: GetLinkedChildrenUseCase,
    private readonly acceptLinkageUseCase: AcceptLinkageUseCase,
    private readonly rejectLinkageUseCase: RejectLinkageUseCase,
    private readonly getChildDetailUseCase: GetChildDetailUseCase,
    private readonly getCounselSessionsUseCase: GetCounselSessionsUseCase,
    private readonly createCounselSessionUseCase: CreateCounselSessionUseCase,
    private readonly updateCounselSessionUseCase: UpdateCounselSessionUseCase,
    private readonly cancelCounselSessionUseCase: CancelCounselSessionUseCase,
    private readonly completeCounselSessionUseCase: CompleteCounselSessionUseCase,
    private readonly getCounselRecordsUseCase: GetCounselRecordsUseCase,
    private readonly getCounselRecordUseCase: GetCounselRecordUseCase,
    private readonly createCounselRecordUseCase: CreateCounselRecordUseCase,
    private readonly updateCounselRecordUseCase: UpdateCounselRecordUseCase,
    private readonly submitCounselRecordUseCase: SubmitCounselRecordUseCase,
    private readonly shareCounselRecordUseCase: ShareCounselRecordUseCase,
  ) {}

  private validateBImpactInstitution(user: CurrentUserData): void {
    if (user.facilityType !== 'B_IMPACT_INSTITUTION') {
      throw new ForbiddenException('B-IMPACT 기관 종사자만 접근할 수 있습니다');
    }
  }

  // ============================================
  // 연계 관리
  // ============================================

  @Get('linked-children')
  @ApiOperation({ summary: '연계 아동 목록 조회' })
  @ApiResponse({ status: 200, description: '연계 아동 목록' })
  async getLinkedChildren(@CurrentUser() user: CurrentUserData): Promise<LinkedChildItem[]> {
    this.validateBImpactInstitution(user);
    return await this.getLinkedChildrenUseCase.execute(user.institutionId);
  }

  @Post('linkages/:id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '연계 수락' })
  @ApiParam({ name: 'id', description: '연계(VoucherLinkage) ID' })
  async acceptLinkage(
    @Param('id') linkageId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ success: boolean }> {
    this.validateBImpactInstitution(user);
    await this.acceptLinkageUseCase.execute(linkageId, user.institutionId);
    return { success: true };
  }

  @Post('linkages/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '연계 거절' })
  @ApiParam({ name: 'id', description: '연계(VoucherLinkage) ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { reason: { type: 'string', description: '거절 사유' } },
      required: ['reason'],
    },
  })
  async rejectLinkage(
    @Param('id') linkageId: string,
    @Body('reason') reason: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ success: boolean }> {
    this.validateBImpactInstitution(user);
    await this.rejectLinkageUseCase.execute(linkageId, user.institutionId, reason);
    return { success: true };
  }

  // ============================================
  // 아동 상세
  // ============================================

  @Get('linked-children/:linkageId/detail')
  @ApiOperation({ summary: '연계 아동 상세 조회' })
  @ApiParam({ name: 'linkageId', description: '연계(VoucherLinkage) ID' })
  async getChildDetail(
    @Param('linkageId') linkageId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    this.validateBImpactInstitution(user);
    return await this.getChildDetailUseCase.execute(linkageId, user.institutionId);
  }

  // ============================================
  // 상담 일정
  // ============================================

  @Get('counsel-sessions')
  @ApiOperation({ summary: '상담 일정 목록 조회 (날짜 범위)' })
  @ApiQuery({ name: 'startDate', required: true, example: '2026-01-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2026-01-31' })
  async getCounselSessions(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    this.validateBImpactInstitution(user);
    return await this.getCounselSessionsUseCase.execute(
      user.institutionId,
      startDate,
      endDate,
    );
  }

  @Post('counsel-sessions')
  @ApiOperation({ summary: '상담 일정 생성' })
  async createCounselSession(
    @Body() dto: CreateCounselSessionDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    this.validateBImpactInstitution(user);
    const result = await this.createCounselSessionUseCase.execute(dto, user.institutionId);
    if (result.isFailure) {
      const error = result.getError();
      throw new HttpException(
        { message: error.message, code: error.code },
        error.code === 'LINKAGE_NOT_FOUND' || error.code === 'REQUEST_NOT_FOUND'
          ? HttpStatus.NOT_FOUND
          : error.code === 'FORBIDDEN'
            ? HttpStatus.FORBIDDEN
            : HttpStatus.BAD_REQUEST,
      );
    }
    return result.getValue();
  }

  @Patch('counsel-sessions/:id')
  @ApiOperation({ summary: '상담 일정 수정' })
  @ApiParam({ name: 'id', description: '상담 세션 ID' })
  async updateCounselSession(
    @Param('id') id: string,
    @Body() dto: UpdateCounselSessionDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    this.validateBImpactInstitution(user);
    const result = await this.updateCounselSessionUseCase.execute(id, dto, user.institutionId);
    if (result.isFailure) {
      const error = result.getError();
      throw new HttpException(
        { message: error.message, code: error.code },
        error.code === 'SESSION_NOT_FOUND'
          ? HttpStatus.NOT_FOUND
          : error.code === 'FORBIDDEN'
            ? HttpStatus.FORBIDDEN
            : HttpStatus.BAD_REQUEST,
      );
    }
    return result.getValue();
  }

  @Post('counsel-sessions/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '상담 일정 취소' })
  @ApiParam({ name: 'id', description: '상담 세션 ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { reason: { type: 'string', description: '취소 사유' } },
      required: ['reason'],
    },
  })
  async cancelCounselSession(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    this.validateBImpactInstitution(user);
    const result = await this.cancelCounselSessionUseCase.execute(
      id,
      reason,
      user.institutionId,
    );
    if (result.isFailure) {
      const error = result.getError();
      throw new HttpException(
        { message: error.message, code: error.code },
        error.code === 'SESSION_NOT_FOUND' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST,
      );
    }
    return { success: true };
  }

  @Post('counsel-sessions/:id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '상담 완료 처리' })
  @ApiParam({ name: 'id', description: '상담 세션 ID' })
  async completeCounselSession(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    this.validateBImpactInstitution(user);
    const result = await this.completeCounselSessionUseCase.execute(id, user.institutionId);
    if (result.isFailure) {
      const error = result.getError();
      throw new HttpException(
        { message: error.message, code: error.code },
        error.code === 'SESSION_NOT_FOUND' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST,
      );
    }
    return { success: true };
  }

  // ============================================
  // 상담 기록
  // ============================================

  @Get('counsel-records')
  @ApiOperation({ summary: '상담 기록 목록 조회 (페이지네이션)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  async getCounselRecords(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @CurrentUser() user: CurrentUserData,
  ) {
    this.validateBImpactInstitution(user);
    return await this.getCounselRecordsUseCase.execute(
      user.institutionId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  @Get('counsel-records/:id')
  @ApiOperation({ summary: '상담 기록 상세 조회' })
  @ApiParam({ name: 'id', description: '상담 기록 ID' })
  async getCounselRecord(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    this.validateBImpactInstitution(user);
    const result = await this.getCounselRecordUseCase.execute(id, user.institutionId);
    if (result.isFailure) {
      const error = result.getError();
      throw new HttpException(
        { message: error.message, code: error.code },
        error.code === 'RECORD_NOT_FOUND' ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN,
      );
    }
    return result.getValue();
  }

  @Post('counsel-records')
  @ApiOperation({ summary: '상담 기록 생성' })
  async createCounselRecord(
    @Body() dto: CreateCounselRecordDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    this.validateBImpactInstitution(user);
    const result = await this.createCounselRecordUseCase.execute(dto, user.institutionId);
    if (result.isFailure) {
      const error = result.getError();
      throw new HttpException(
        { message: error.message, code: error.code },
        error.code === 'SESSION_NOT_FOUND'
          ? HttpStatus.NOT_FOUND
          : error.code === 'RECORD_ALREADY_EXISTS'
            ? HttpStatus.CONFLICT
            : HttpStatus.BAD_REQUEST,
      );
    }
    return result.getValue();
  }

  @Patch('counsel-records/:id')
  @ApiOperation({ summary: '상담 기록 수정 (DRAFT 상태만)' })
  @ApiParam({ name: 'id', description: '상담 기록 ID' })
  async updateCounselRecord(
    @Param('id') id: string,
    @Body() dto: UpdateCounselRecordDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    this.validateBImpactInstitution(user);
    const result = await this.updateCounselRecordUseCase.execute(
      id,
      dto,
      user.institutionId,
    );
    if (result.isFailure) {
      const error = result.getError();
      throw new HttpException(
        { message: error.message, code: error.code },
        error.code === 'RECORD_NOT_FOUND' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST,
      );
    }
    return result.getValue();
  }

  @Post('counsel-records/:id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '상담 기록 제출 + AI 요약 생성' })
  @ApiParam({ name: 'id', description: '상담 기록 ID' })
  async submitCounselRecord(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    this.validateBImpactInstitution(user);
    const result = await this.submitCounselRecordUseCase.execute(id, user.institutionId);
    if (result.isFailure) {
      const error = result.getError();
      throw new HttpException(
        { message: error.message, code: error.code },
        error.code === 'RECORD_NOT_FOUND' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST,
      );
    }
    return result.getValue();
  }

  @Post('counsel-records/:id/share')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '상담 결과 공유' })
  @ApiParam({ name: 'id', description: '상담 기록 ID' })
  async shareCounselRecord(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    this.validateBImpactInstitution(user);
    const result = await this.shareCounselRecordUseCase.execute(id, user.institutionId);
    if (result.isFailure) {
      const error = result.getError();
      throw new HttpException(
        { message: error.message, code: error.code },
        error.code === 'RECORD_NOT_FOUND' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST,
      );
    }
    return { success: true };
  }
}
