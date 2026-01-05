import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import {
  CreateCounselReportDto,
  UpdateCounselReportDto,
  ApproveCounselReportDto,
  CounselReportResponseDto,
  PaginatedCounselReportResponseDto,
} from '@application/counsel-report/dto';
import {
  CreateCounselReportUseCase,
  UpdateCounselReportUseCase,
  SubmitCounselReportUseCase,
  GetCounselReportUseCase,
  GetCounselReportsByRequestUseCase,
  ReviewCounselReportUseCase,
  ApproveCounselReportUseCase,
} from '@application/counsel-report/use-cases';
import {
  CurrentUser,
  CurrentUserData,
} from '@infrastructure/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';

/**
 * 면담결과지 Controller
 *
 * @description
 * 상담사가 매 회차 상담 후 작성하는 면담결과지 관리
 * - 상담사: 생성, 수정, 제출
 * - 보호자: 조회, 확인, 승인(피드백 작성)
 * - 기관: 조회
 */
@ApiTags('Counsel Reports (면담결과지)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/counsel-reports')
export class CounselReportController {
  constructor(
    private readonly createCounselReportUseCase: CreateCounselReportUseCase,
    private readonly updateCounselReportUseCase: UpdateCounselReportUseCase,
    private readonly submitCounselReportUseCase: SubmitCounselReportUseCase,
    private readonly getCounselReportUseCase: GetCounselReportUseCase,
    private readonly getCounselReportsByRequestUseCase: GetCounselReportsByRequestUseCase,
    private readonly reviewCounselReportUseCase: ReviewCounselReportUseCase,
    private readonly approveCounselReportUseCase: ApproveCounselReportUseCase,
  ) {}

  // ==================== 상담사 전용 ====================

  @Post()
  @ApiOperation({
    summary: '면담결과지 생성 (상담사)',
    description: '상담 후 면담결과지를 작성 (DRAFT 상태)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '면담결과지 생성 성공',
    type: CounselReportResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '유효성 검증 실패',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '해당 회차 면담결과지가 이미 존재',
  })
  async createCounselReport(
    @Body() dto: CreateCounselReportDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<CounselReportResponseDto> {
    const counselorId = user.userId;
    const institutionId = user.institutionId;

    if (!institutionId) {
      throw new HttpException(
        {
          message: '기관 정보가 없습니다. 상담사 프로필을 확인해주세요.',
          code: 'INSTITUTION_ID_REQUIRED',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.createCounselReportUseCase.execute(dto, counselorId, institutionId);

    if (result.isFailure) {
      throw new HttpException(
        {
          message: result.getError().message,
          code: result.getError().code,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return result.getValue();
  }

  @Patch(':id')
  @ApiOperation({
    summary: '면담결과지 수정 (상담사)',
    description: 'DRAFT 상태의 면담결과지만 수정 가능',
  })
  @ApiParam({ name: 'id', description: '면담결과지 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '수정 성공',
    type: CounselReportResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '면담결과지를 찾을 수 없음',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '본인이 작성한 결과지가 아니거나 수정 불가능한 상태',
  })
  async updateCounselReport(
    @Param('id') id: string,
    @Body() dto: UpdateCounselReportDto,
    @CurrentUser('userId') counselorId: string,
  ): Promise<CounselReportResponseDto> {
    const result = await this.updateCounselReportUseCase.execute(id, dto, counselorId);

    if (result.isFailure) {
      const error = result.getError();
      const statusCode =
        error.code === 'REPORT_NOT_FOUND'
          ? HttpStatus.NOT_FOUND
          : error.code === 'UNAUTHORIZED'
            ? HttpStatus.FORBIDDEN
            : HttpStatus.BAD_REQUEST;

      throw new HttpException({ message: error.message, code: error.code }, statusCode);
    }

    return result.getValue();
  }

  @Post(':id/submit')
  @ApiOperation({
    summary: '면담결과지 제출 (상담사)',
    description: 'DRAFT → SUBMITTED 상태 전환하여 보호자에게 전달',
  })
  @ApiParam({ name: 'id', description: '면담결과지 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '제출 성공',
    type: CounselReportResponseDto,
  })
  async submitCounselReport(
    @Param('id') id: string,
    @CurrentUser('userId') counselorId: string,
  ): Promise<CounselReportResponseDto> {
    const result = await this.submitCounselReportUseCase.execute(id, counselorId);

    if (result.isFailure) {
      throw new HttpException(
        {
          message: result.getError().message,
          code: result.getError().code,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return result.getValue();
  }

  // ==================== 보호자 전용 ====================

  @Post(':id/review')
  @ApiOperation({
    summary: '면담결과지 확인 (보호자)',
    description: 'SUBMITTED → REVIEWED 상태 전환',
  })
  @ApiParam({ name: 'id', description: '면담결과지 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '확인 처리 성공',
    type: CounselReportResponseDto,
  })
  async reviewCounselReport(
    @Param('id') id: string,
    @CurrentUser('userId') guardianId: string,
  ): Promise<CounselReportResponseDto> {
    const result = await this.reviewCounselReportUseCase.execute(id, guardianId);

    if (result.isFailure) {
      throw new HttpException(
        {
          message: result.getError().message,
          code: result.getError().code,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return result.getValue();
  }

  @Post(':id/approve')
  @ApiOperation({
    summary: '면담결과지 승인 (보호자)',
    description: 'REVIEWED → APPROVED 상태 전환 (피드백 작성 포함)',
  })
  @ApiParam({ name: 'id', description: '면담결과지 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '승인 성공',
    type: CounselReportResponseDto,
  })
  async approveCounselReport(
    @Param('id') id: string,
    @Body() dto: ApproveCounselReportDto,
    @CurrentUser('userId') guardianId: string,
  ): Promise<CounselReportResponseDto> {
    const result = await this.approveCounselReportUseCase.execute(id, dto, guardianId);

    if (result.isFailure) {
      throw new HttpException(
        {
          message: result.getError().message,
          code: result.getError().code,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return result.getValue();
  }

  // ==================== 공통 조회 ====================

  @Get(':id')
  @ApiOperation({
    summary: '면담결과지 단건 조회',
    description: '면담결과지 상세 정보 조회',
  })
  @ApiParam({ name: 'id', description: '면담결과지 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '조회 성공',
    type: CounselReportResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '면담결과지를 찾을 수 없음',
  })
  async getCounselReport(@Param('id') id: string): Promise<CounselReportResponseDto> {
    const result = await this.getCounselReportUseCase.execute(id);

    if (result.isFailure) {
      throw new HttpException(
        {
          message: result.getError().message,
          code: result.getError().code,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return result.getValue();
  }

  @Get('counsel-request/:counselRequestId')
  @ApiOperation({
    summary: '상담의뢰지별 면담결과지 목록 조회',
    description: '특정 상담의뢰지에 대한 모든 회차의 면담결과지 조회',
  })
  @ApiParam({ name: 'counselRequestId', description: '상담의뢰지 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '조회 성공',
    type: [CounselReportResponseDto],
  })
  async getCounselReportsByRequest(
    @Param('counselRequestId') counselRequestId: string,
  ): Promise<CounselReportResponseDto[]> {
    return await this.getCounselReportsByRequestUseCase.execute(counselRequestId);
  }
}
