import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChildRepository } from '@domain/child/repository/child.repository';
import { ChildResponseDto } from '@application/child/dto/child-response.dto';
import { RegisterChildDto } from '@application/child/dto/register-child.dto';
import { RegisterChildUseCase } from '@application/child/use-cases/register-child/register-child.use-case';
import { CurrentUser, CurrentUserData } from '@infrastructure/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';
import { ChildType } from '@infrastructure/persistence/typeorm/entity/enums/child-type.enum';

/**
 * 아동 관리 Controller
 *
 * NOTE: 모든 아동은 시설(Institution)에 직접 연결됩니다.
 * 시설 인증 후 해당 시설의 아동만 조회/관리할 수 있습니다.
 */
@ApiTags('아동 관리')
@Controller('api/v1/children')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChildController {
  constructor(
    private readonly registerChildUseCase: RegisterChildUseCase,
    @Inject('ChildRepository')
    private readonly childRepository: ChildRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: '내 시설의 아동 목록 조회 (로그인한 시설)' })
  @ApiResponse({
    status: 200,
    description: '아동 목록',
    type: [ChildResponseDto],
  })
  async getMyChildren(@CurrentUser() user: CurrentUserData): Promise<ChildResponseDto[]> {
    // 시설 인증인지 확인
    if (user.role !== 'INSTITUTION' || !user.facilityType || !user.institutionId) {
      throw new ForbiddenException('시설 로그인이 필요합니다.');
    }

    // 시설 유형에 따라 조회
    if (user.facilityType === 'CARE_FACILITY') {
      const children = await this.childRepository.findByCareFacilityId(user.institutionId);
      return children.map((child) => ChildResponseDto.fromDomain(child));
    }

    if (user.facilityType === 'COMMUNITY_CENTER') {
      const children = await this.childRepository.findByCommunityChildCenterId(user.institutionId);
      return children.map((child) => ChildResponseDto.fromDomain(child));
    }

    throw new BadRequestException('알 수 없는 시설 유형입니다.');
  }

  @Post()
  @ApiOperation({
    summary: '아동 등록',
    description: `
시설 로그인 후 아동을 등록합니다.
- CARE_FACILITY (양육시설): 양육시설 ID가 자동으로 연결됩니다.
- COMMUNITY_CENTER (지역아동센터): 지역아동센터 ID가 자동으로 연결됩니다.
    `,
  })
  @ApiResponse({
    status: 201,
    description: '아동이 성공적으로 등록되었습니다',
    type: ChildResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 403, description: '시설 로그인 필요' })
  async registerChild(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: RegisterChildDto,
  ): Promise<ChildResponseDto> {
    // 시설 인증인지 확인
    if (user.role !== 'INSTITUTION' || !user.facilityType || !user.institutionId) {
      throw new ForbiddenException('시설 로그인이 필요합니다.');
    }

    // 시설 유형과 요청 아동 유형 일치 여부 확인
    if (user.facilityType === 'CARE_FACILITY') {
      if (dto.childType !== ChildType.CARE_FACILITY) {
        throw new BadRequestException('양육시설에서는 양육시설 아동만 등록할 수 있습니다.');
      }
      // 시설 ID 자동 주입
      return await this.registerChildUseCase.execute({
        ...dto,
        careFacilityId: user.institutionId,
      });
    }

    if (user.facilityType === 'COMMUNITY_CENTER') {
      if (dto.childType !== ChildType.COMMUNITY_CENTER) {
        throw new BadRequestException('지역아동센터에서는 지역아동센터 아동만 등록할 수 있습니다.');
      }
      // 시설 ID 자동 주입
      return await this.registerChildUseCase.execute({
        ...dto,
        communityChildCenterId: user.institutionId,
      });
    }

    throw new BadRequestException('알 수 없는 시설 유형입니다.');
  }

  @Get(':id')
  @ApiOperation({ summary: '아동 상세 조회' })
  @ApiResponse({
    status: 200,
    description: '아동 상세 정보',
    type: ChildResponseDto,
  })
  @ApiResponse({ status: 403, description: '조회 권한 없음' })
  @ApiResponse({ status: 404, description: '아동을 찾을 수 없음' })
  async getChild(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ): Promise<ChildResponseDto> {
    const child = await this.childRepository.findById(id);
    if (!child) {
      throw new NotFoundException('아동을 찾을 수 없습니다.');
    }

    // 권한 확인: 시설 인증인 경우 해당 시설의 아동인지 확인
    if (user.role === 'INSTITUTION' && user.institutionId) {
      const hasPermission =
        (child.careFacilityId && child.careFacilityId === user.institutionId) ||
        (child.communityChildCenterId && child.communityChildCenterId === user.institutionId);

      if (!hasPermission) {
        throw new ForbiddenException('이 아동을 조회할 권한이 없습니다.');
      }
    }

    return ChildResponseDto.fromDomain(child);
  }

  @Delete(':id')
  @ApiOperation({ summary: '아동 삭제' })
  @ApiResponse({ status: 200, description: '아동 삭제 성공' })
  @ApiResponse({ status: 403, description: '삭제 권한 없음' })
  @ApiResponse({ status: 404, description: '아동을 찾을 수 없음' })
  async deleteChild(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    // 아동 존재 확인
    const child = await this.childRepository.findById(id);
    if (!child) {
      throw new NotFoundException('아동을 찾을 수 없습니다.');
    }

    // 시설 인증인지 확인
    if (user.role !== 'INSTITUTION' || !user.institutionId) {
      throw new ForbiddenException('시설 로그인이 필요합니다.');
    }

    // 권한 확인: 해당 시설의 아동인지 확인
    const hasPermission =
      (child.careFacilityId && child.careFacilityId === user.institutionId) ||
      (child.communityChildCenterId && child.communityChildCenterId === user.institutionId);

    if (!hasPermission) {
      throw new ForbiddenException('이 아동을 삭제할 권한이 없습니다.');
    }

    await this.childRepository.delete(id);

    return { message: '아동이 삭제되었습니다.' };
  }
}
