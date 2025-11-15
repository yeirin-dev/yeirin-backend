import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from '@infrastructure/auth/decorators/public.decorator';
import { GetInstitutionUseCase } from '@application/institution/use-case/get-institution.usecase';
import { GetInstitutionsUseCase } from '@application/institution/use-case/get-institutions.usecase';
import { CreateInstitutionUseCase } from '@application/institution/use-case/create-institution.usecase';
import { UpdateInstitutionUseCase } from '@application/institution/use-case/update-institution.usecase';
import { DeleteInstitutionUseCase } from '@application/institution/use-case/delete-institution.usecase';
import { CreateInstitutionDto } from '@application/institution/dto/create-institution.dto';
import { UpdateInstitutionDto } from '@application/institution/dto/update-institution.dto';
import {
  InstitutionResponseDto,
  InstitutionListResponseDto,
} from '@application/institution/dto/institution-response.dto';

/**
 * 바우처 기관 Controller
 */
@ApiTags('institutions')
@Controller('api/v1/institutions')
export class InstitutionController {
  constructor(
    private readonly getInstitutionUseCase: GetInstitutionUseCase,
    private readonly getInstitutionsUseCase: GetInstitutionsUseCase,
    private readonly createInstitutionUseCase: CreateInstitutionUseCase,
    private readonly updateInstitutionUseCase: UpdateInstitutionUseCase,
    private readonly deleteInstitutionUseCase: DeleteInstitutionUseCase,
  ) {}

  /**
   * 기관 목록 조회 (페이지네이션)
   */
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '바우처 기관 목록 조회',
    description: '등록된 모든 바우처 기관을 페이지네이션으로 조회합니다.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호 (기본값: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지당 개수 (기본값: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: InstitutionListResponseDto,
  })
  async getInstitutions(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<InstitutionListResponseDto> {
    return await this.getInstitutionsUseCase.execute(Number(page), Number(limit));
  }

  /**
   * 기관 단건 조회
   */
  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '바우처 기관 상세 조회',
    description: 'ID를 기반으로 특정 바우처 기관의 상세 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '기관 ID (UUID)',
    example: '93dfda2d-6cd3-4e86-8259-ee1c098234f7',
  })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: InstitutionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '기관을 찾을 수 없음',
  })
  async getInstitution(@Param('id') id: string): Promise<InstitutionResponseDto> {
    return await this.getInstitutionUseCase.execute(id);
  }

  /**
   * 기관 생성 (ADMIN 전용)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '바우처 기관 생성 (ADMIN 전용)',
    description: '새로운 바우처 기관을 등록합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '생성 성공',
    type: InstitutionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (유효성 검증 실패)',
  })
  @ApiResponse({
    status: 401,
    description: '인증 필요',
  })
  @ApiResponse({
    status: 403,
    description: 'ADMIN 권한 필요',
  })
  async createInstitution(@Body() dto: CreateInstitutionDto): Promise<InstitutionResponseDto> {
    return await this.createInstitutionUseCase.execute(dto);
  }

  /**
   * 기관 수정 (ADMIN 전용)
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '바우처 기관 수정 (ADMIN 전용)',
    description: '기존 바우처 기관의 정보를 수정합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '기관 ID (UUID)',
    example: '93dfda2d-6cd3-4e86-8259-ee1c098234f7',
  })
  @ApiResponse({
    status: 200,
    description: '수정 성공',
    type: InstitutionResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 필요',
  })
  @ApiResponse({
    status: 403,
    description: 'ADMIN 권한 필요',
  })
  @ApiResponse({
    status: 404,
    description: '기관을 찾을 수 없음',
  })
  async updateInstitution(
    @Param('id') id: string,
    @Body() dto: UpdateInstitutionDto,
  ): Promise<InstitutionResponseDto> {
    return await this.updateInstitutionUseCase.execute(id, dto);
  }

  /**
   * 기관 삭제 (ADMIN 전용)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '바우처 기관 삭제 (ADMIN 전용)',
    description: '기존 바우처 기관을 삭제합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '기관 ID (UUID)',
    example: '93dfda2d-6cd3-4e86-8259-ee1c098234f7',
  })
  @ApiResponse({
    status: 204,
    description: '삭제 성공',
  })
  @ApiResponse({
    status: 401,
    description: '인증 필요',
  })
  @ApiResponse({
    status: 403,
    description: 'ADMIN 권한 필요',
  })
  @ApiResponse({
    status: 404,
    description: '기관을 찾을 수 없음',
  })
  async deleteInstitution(@Param('id') id: string): Promise<void> {
    return await this.deleteInstitutionUseCase.execute(id);
  }
}
