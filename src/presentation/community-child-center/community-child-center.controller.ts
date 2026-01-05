import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CommunityChildCenterListResponseDto,
  CommunityChildCenterResponseDto,
} from '@application/community-child-center/dto/community-child-center-response.dto';
import { CreateCommunityChildCenterDto } from '@application/community-child-center/dto/create-community-child-center.dto';
import { UpdateCommunityChildCenterDto } from '@application/community-child-center/dto/update-community-child-center.dto';
import { CreateCommunityChildCenterUseCase } from '@application/community-child-center/use-case/create-community-child-center.usecase';
import { DeleteCommunityChildCenterUseCase } from '@application/community-child-center/use-case/delete-community-child-center.usecase';
import { GetCommunityChildCenterUseCase } from '@application/community-child-center/use-case/get-community-child-center.usecase';
import { GetCommunityChildCentersUseCase } from '@application/community-child-center/use-case/get-community-child-centers.usecase';
import { UpdateCommunityChildCenterUseCase } from '@application/community-child-center/use-case/update-community-child-center.usecase';
import { Public } from '@infrastructure/auth/decorators/public.decorator';

/**
 * 지역아동센터 Controller
 */
@ApiTags('지역아동센터')
@Controller('api/v1/community-child-centers')
export class CommunityChildCenterController {
  constructor(
    private readonly getCommunityChildCenterUseCase: GetCommunityChildCenterUseCase,
    private readonly getCommunityChildCentersUseCase: GetCommunityChildCentersUseCase,
    private readonly createCommunityChildCenterUseCase: CreateCommunityChildCenterUseCase,
    private readonly updateCommunityChildCenterUseCase: UpdateCommunityChildCenterUseCase,
    private readonly deleteCommunityChildCenterUseCase: DeleteCommunityChildCenterUseCase,
  ) {}

  /**
   * 지역아동센터 목록 조회 (페이지네이션)
   */
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '지역아동센터 목록 조회',
    description: '등록된 모든 지역아동센터를 페이지네이션으로 조회합니다.',
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
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: '활성화 상태 필터 (true/false)',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: CommunityChildCenterListResponseDto,
  })
  async getCommunityChildCenters(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('isActive') isActive?: string,
  ): Promise<CommunityChildCenterListResponseDto> {
    const isActiveFilter = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return await this.getCommunityChildCentersUseCase.execute(
      Number(page),
      Number(limit),
      isActiveFilter,
    );
  }

  /**
   * 지역아동센터 단건 조회
   */
  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '지역아동센터 상세 조회',
    description: 'ID를 기반으로 특정 지역아동센터의 상세 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '지역아동센터 ID (UUID)',
    example: '93dfda2d-6cd3-4e86-8259-ee1c098234f7',
  })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: CommunityChildCenterResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '지역아동센터를 찾을 수 없음',
  })
  async getCommunityChildCenter(@Param('id') id: string): Promise<CommunityChildCenterResponseDto> {
    return await this.getCommunityChildCenterUseCase.execute(id);
  }

  /**
   * 지역아동센터 생성 (ADMIN 전용)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '지역아동센터 생성 (ADMIN 전용)',
    description: '새로운 지역아동센터를 등록합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '생성 성공',
    type: CommunityChildCenterResponseDto,
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
  async createCommunityChildCenter(
    @Body() dto: CreateCommunityChildCenterDto,
  ): Promise<CommunityChildCenterResponseDto> {
    return await this.createCommunityChildCenterUseCase.execute(dto);
  }

  /**
   * 지역아동센터 수정 (ADMIN 전용)
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '지역아동센터 수정 (ADMIN 전용)',
    description: '기존 지역아동센터의 정보를 수정합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '지역아동센터 ID (UUID)',
    example: '93dfda2d-6cd3-4e86-8259-ee1c098234f7',
  })
  @ApiResponse({
    status: 200,
    description: '수정 성공',
    type: CommunityChildCenterResponseDto,
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
    description: '지역아동센터를 찾을 수 없음',
  })
  async updateCommunityChildCenter(
    @Param('id') id: string,
    @Body() dto: UpdateCommunityChildCenterDto,
  ): Promise<CommunityChildCenterResponseDto> {
    return await this.updateCommunityChildCenterUseCase.execute(id, dto);
  }

  /**
   * 지역아동센터 삭제 (ADMIN 전용)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '지역아동센터 삭제 (ADMIN 전용)',
    description: '기존 지역아동센터를 삭제합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '지역아동센터 ID (UUID)',
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
    description: '지역아동센터를 찾을 수 없음',
  })
  async deleteCommunityChildCenter(@Param('id') id: string): Promise<void> {
    return await this.deleteCommunityChildCenterUseCase.execute(id);
  }
}
