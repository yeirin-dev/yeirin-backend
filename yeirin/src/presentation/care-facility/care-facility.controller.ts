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
  CareFacilityListResponseDto,
  CareFacilityResponseDto,
} from '@application/care-facility/dto/care-facility-response.dto';
import { CreateCareFacilityDto } from '@application/care-facility/dto/create-care-facility.dto';
import { UpdateCareFacilityDto } from '@application/care-facility/dto/update-care-facility.dto';
import { CreateCareFacilityUseCase } from '@application/care-facility/use-case/create-care-facility.usecase';
import { DeleteCareFacilityUseCase } from '@application/care-facility/use-case/delete-care-facility.usecase';
import { GetCareFacilitiesUseCase } from '@application/care-facility/use-case/get-care-facilities.usecase';
import { GetCareFacilityUseCase } from '@application/care-facility/use-case/get-care-facility.usecase';
import { UpdateCareFacilityUseCase } from '@application/care-facility/use-case/update-care-facility.usecase';
import { Public } from '@infrastructure/auth/decorators/public.decorator';

/**
 * 양육시설 Controller
 */
@ApiTags('양육시설')
@Controller('api/v1/care-facilities')
export class CareFacilityController {
  constructor(
    private readonly getCareFacilityUseCase: GetCareFacilityUseCase,
    private readonly getCareFacilitiesUseCase: GetCareFacilitiesUseCase,
    private readonly createCareFacilityUseCase: CreateCareFacilityUseCase,
    private readonly updateCareFacilityUseCase: UpdateCareFacilityUseCase,
    private readonly deleteCareFacilityUseCase: DeleteCareFacilityUseCase,
  ) {}

  /**
   * 양육시설 목록 조회 (페이지네이션)
   */
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '양육시설 목록 조회',
    description: '등록된 모든 양육시설을 페이지네이션으로 조회합니다.',
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
    type: CareFacilityListResponseDto,
  })
  async getCareFacilities(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('isActive') isActive?: string,
  ): Promise<CareFacilityListResponseDto> {
    const isActiveFilter = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return await this.getCareFacilitiesUseCase.execute(Number(page), Number(limit), isActiveFilter);
  }

  /**
   * 양육시설 단건 조회
   */
  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '양육시설 상세 조회',
    description: 'ID를 기반으로 특정 양육시설의 상세 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '양육시설 ID (UUID)',
    example: '93dfda2d-6cd3-4e86-8259-ee1c098234f7',
  })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: CareFacilityResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '양육시설을 찾을 수 없음',
  })
  async getCareFacility(@Param('id') id: string): Promise<CareFacilityResponseDto> {
    return await this.getCareFacilityUseCase.execute(id);
  }

  /**
   * 양육시설 생성 (ADMIN 전용)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '양육시설 생성 (ADMIN 전용)',
    description: '새로운 양육시설을 등록합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '생성 성공',
    type: CareFacilityResponseDto,
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
  async createCareFacility(@Body() dto: CreateCareFacilityDto): Promise<CareFacilityResponseDto> {
    return await this.createCareFacilityUseCase.execute(dto);
  }

  /**
   * 양육시설 수정 (ADMIN 전용)
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '양육시설 수정 (ADMIN 전용)',
    description: '기존 양육시설의 정보를 수정합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '양육시설 ID (UUID)',
    example: '93dfda2d-6cd3-4e86-8259-ee1c098234f7',
  })
  @ApiResponse({
    status: 200,
    description: '수정 성공',
    type: CareFacilityResponseDto,
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
    description: '양육시설을 찾을 수 없음',
  })
  async updateCareFacility(
    @Param('id') id: string,
    @Body() dto: UpdateCareFacilityDto,
  ): Promise<CareFacilityResponseDto> {
    return await this.updateCareFacilityUseCase.execute(id, dto);
  }

  /**
   * 양육시설 삭제 (ADMIN 전용)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '양육시설 삭제 (ADMIN 전용)',
    description: '기존 양육시설을 삭제합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '양육시설 ID (UUID)',
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
    description: '양육시설을 찾을 수 없음',
  })
  async deleteCareFacility(@Param('id') id: string): Promise<void> {
    return await this.deleteCareFacilityUseCase.execute(id);
  }
}
