import { Body, Controller, Get, Inject, Param, Post, Request, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChildResponseDto } from '@application/child/dto/child-response.dto';
import { RegisterChildDto } from '@application/child/dto/register-child.dto';
import { GetChildrenByGuardianUseCase } from '@application/child/use-cases/get-children-by-guardian/get-children-by-guardian.use-case';
import { RegisterChildUseCase } from '@application/child/use-cases/register-child/register-child.use-case';
import { GuardianProfileRepository } from '@domain/guardian/repository/guardian-profile.repository';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';

/**
 * 아동 관리 Controller
 * - Guardian(보호자)이 아동 등록 및 조회
 */
@ApiTags('아동 관리')
@Controller('children')
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
  async getMyChildren(@Request() req: any): Promise<ChildResponseDto[]> {
    const userId = req.user.userId;

    // GuardianProfile 조회
    const guardianProfile = await this.guardianRepository.findByUserId(userId);
    if (!guardianProfile) {
      throw new NotFoundException('보호자 프로필을 찾을 수 없습니다.');
    }

    return await this.getChildrenByGuardianUseCase.execute(guardianProfile.id);
  }

  @Post()
  @ApiOperation({ summary: '아동 등록 (보호자)' })
  @ApiResponse({
    status: 201,
    description: '아동이 성공적으로 등록되었습니다',
    type: ChildResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 404, description: '보호자를 찾을 수 없음' })
  async registerChild(
    @Request() req: any,
    @Body() dto: RegisterChildDto,
  ): Promise<ChildResponseDto> {
    // 1. JWT에서 userId 추출 (Presentation Layer 책임)
    const userId = req.user.userId;

    // 2. GuardianProfile 조회 (인증 컨텍스트를 도메인 식별자로 변환)
    const guardianProfile = await this.guardianRepository.findByUserId(userId);
    if (!guardianProfile) {
      throw new NotFoundException('보호자 프로필을 찾을 수 없습니다. 먼저 보호자로 등록해주세요.');
    }

    // 3. guardianId 주입하여 UseCase 실행
    return await this.registerChildUseCase.execute({
      ...dto,
      guardianId: guardianProfile.id,
    });
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
