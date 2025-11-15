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
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from '@infrastructure/auth/decorators/public.decorator';
import { CreateCounselorProfileDto } from '@application/counselor/dto/create-counselor-profile.dto';
import { UpdateCounselorProfileDto } from '@application/counselor/dto/update-counselor-profile.dto';
import {
  CounselorProfileResponseDto,
  CounselorProfileListResponseDto,
} from '@application/counselor/dto/counselor-profile-response.dto';
import { CreateCounselorProfileUseCase } from '@application/counselor/use-case/create-counselor-profile.usecase';
import { UpdateCounselorProfileUseCase } from '@application/counselor/use-case/update-counselor-profile.usecase';
import { GetCounselorProfileUseCase } from '@application/counselor/use-case/get-counselor-profile.usecase';
import { GetCounselorProfilesUseCase } from '@application/counselor/use-case/get-counselor-profiles.usecase';
import { DeleteCounselorProfileUseCase } from '@application/counselor/use-case/delete-counselor-profile.usecase';

@ApiTags('상담사 프로필')
@Controller('counselors')
export class CounselorProfileController {
  constructor(
    private readonly createCounselorProfileUseCase: CreateCounselorProfileUseCase,
    private readonly updateCounselorProfileUseCase: UpdateCounselorProfileUseCase,
    private readonly getCounselorProfileUseCase: GetCounselorProfileUseCase,
    private readonly getCounselorProfilesUseCase: GetCounselorProfilesUseCase,
    private readonly deleteCounselorProfileUseCase: DeleteCounselorProfileUseCase,
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '상담사 프로필 생성 (인증 필요)' })
  @ApiResponse({
    status: 201,
    description: '상담사 프로필 생성 성공',
    type: CounselorProfileResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async createCounselorProfile(
    @Body() dto: CreateCounselorProfileDto,
  ): Promise<CounselorProfileResponseDto> {
    return await this.createCounselorProfileUseCase.execute(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: '상담사 프로필 목록 조회 (공개)' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 개수', example: 10 })
  @ApiResponse({
    status: 200,
    description: '상담사 프로필 목록 조회 성공',
    type: CounselorProfileListResponseDto,
  })
  async getCounselorProfiles(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<CounselorProfileListResponseDto> {
    return await this.getCounselorProfilesUseCase.execute(page, limit);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: '상담사 프로필 단건 조회 (공개)' })
  @ApiParam({ name: 'id', description: '상담사 ID' })
  @ApiResponse({
    status: 200,
    description: '상담사 프로필 조회 성공',
    type: CounselorProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: '상담사 프로필을 찾을 수 없음' })
  async getCounselorProfile(@Param('id') id: string): Promise<CounselorProfileResponseDto> {
    return await this.getCounselorProfileUseCase.execute(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '상담사 프로필 수정 (본인 또는 ADMIN)' })
  @ApiParam({ name: 'id', description: '상담사 ID' })
  @ApiResponse({
    status: 200,
    description: '상담사 프로필 수정 성공',
    type: CounselorProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: '권한 없음 (본인 또는 ADMIN만 가능)' })
  @ApiResponse({ status: 404, description: '상담사 프로필을 찾을 수 없음' })
  async updateCounselorProfile(
    @Param('id') id: string,
    @Body() dto: UpdateCounselorProfileDto,
  ): Promise<CounselorProfileResponseDto> {
    return await this.updateCounselorProfileUseCase.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '상담사 프로필 삭제 (본인 또는 ADMIN)' })
  @ApiParam({ name: 'id', description: '상담사 ID' })
  @ApiResponse({ status: 204, description: '상담사 프로필 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: '권한 없음 (본인 또는 ADMIN만 가능)' })
  @ApiResponse({ status: 404, description: '상담사 프로필을 찾을 수 없음' })
  async deleteCounselorProfile(@Param('id') id: string): Promise<void> {
    return await this.deleteCounselorProfileUseCase.execute(id);
  }
}
