import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChildResponseDto } from '@application/child/dto/child-response.dto';
import { RegisterChildDto } from '@application/child/dto/register-child.dto';
import { GetChildrenByGuardianUseCase } from '@application/child/use-cases/get-children-by-guardian/get-children-by-guardian.use-case';
import { RegisterChildUseCase } from '@application/child/use-cases/register-child/register-child.use-case';
import { GuardianProfileRepository } from '@domain/guardian/repository/guardian-profile.repository';
import { CurrentUser } from '@infrastructure/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';
import { ChildType } from '@infrastructure/persistence/typeorm/entity/enums/child-type.enum';

/**
 * 아동 관리 Controller
 *
 * 아동 유형별 등록:
 * - CARE_FACILITY (양육시설 아동): 관리자/양육시설 선생님이 등록, guardianId 불필요
 * - COMMUNITY_CENTER (지역아동센터 아동): 부모가 등록, guardianId 자동 주입
 * - REGULAR (일반 아동): 부모가 등록, guardianId 자동 주입
 */
@ApiTags('아동 관리')
@Controller('api/v1/children')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChildController {
  constructor(
    private readonly registerChildUseCase: RegisterChildUseCase,
    private readonly getChildrenByGuardianUseCase: GetChildrenByGuardianUseCase,
    @Inject('GuardianProfileRepository')
    private readonly guardianRepository: GuardianProfileRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: '내가 담당하는 아동 목록 조회 (로그인한 보호자)' })
  @ApiResponse({
    status: 200,
    description: '아동 목록',
    type: [ChildResponseDto],
  })
  async getMyChildren(@CurrentUser('userId') userId: string): Promise<ChildResponseDto[]> {
    // GuardianProfile 조회
    const guardianProfile = await this.guardianRepository.findByUserId(userId);
    if (!guardianProfile) {
      throw new NotFoundException('보호자 프로필을 찾을 수 없습니다.');
    }

    return await this.getChildrenByGuardianUseCase.execute(guardianProfile.id);
  }

  @Post()
  @ApiOperation({
    summary: '아동 등록',
    description: `
아동 유형별 등록 방법:
- CARE_FACILITY (양육시설 아동, 고아): careFacilityId 필수, guardianId 불필요
- COMMUNITY_CENTER (지역아동센터 아동): communityChildCenterId 필수, guardianId 자동 주입 (로그인한 보호자)
- REGULAR (일반 아동): guardianId 자동 주입 (로그인한 보호자)
    `,
  })
  @ApiResponse({
    status: 201,
    description: '아동이 성공적으로 등록되었습니다',
    type: ChildResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 404, description: '보호자/기관을 찾을 수 없음' })
  async registerChild(
    @CurrentUser('userId') userId: string,
    @Body() dto: RegisterChildDto,
  ): Promise<ChildResponseDto> {
    // 1. 양육시설 아동(고아)이 아닌 경우에만 guardianId 자동 주입
    if (dto.childType !== ChildType.CARE_FACILITY) {
      // GuardianProfile 조회 (인증 컨텍스트를 도메인 식별자로 변환)
      const guardianProfile = await this.guardianRepository.findByUserId(userId);
      if (!guardianProfile) {
        throw new NotFoundException(
          '보호자 프로필을 찾을 수 없습니다. 먼저 보호자로 등록해주세요.',
        );
      }

      // guardianId 주입하여 UseCase 실행
      return await this.registerChildUseCase.execute({
        ...dto,
        guardianId: guardianProfile.id,
      });
    }

    // 2. 양육시설 아동(고아)의 경우 guardianId 없이 등록
    return await this.registerChildUseCase.execute(dto);
  }

  @Get('guardian/:guardianId')
  @ApiOperation({ summary: '보호자 ID로 아동 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '아동 목록',
    type: [ChildResponseDto],
  })
  async getChildrenByGuardian(
    @Param('guardianId') guardianId: string,
  ): Promise<ChildResponseDto[]> {
    return await this.getChildrenByGuardianUseCase.execute(guardianId);
  }
}
