import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';
import { RegisterChildUseCase } from '@application/child/use-cases/register-child/register-child.use-case';
import { GetChildrenByGuardianUseCase } from '@application/child/use-cases/get-children-by-guardian/get-children-by-guardian.use-case';
import { RegisterChildDto } from '@application/child/dto/register-child.dto';
import { ChildResponseDto } from '@application/child/dto/child-response.dto';

/**
 * 아동 관리 Controller
 * - Guardian(보호자)이 아동 등록 및 조회
 */
@ApiTags('Children')
@Controller('children')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChildController {
  constructor(
    private readonly registerChildUseCase: RegisterChildUseCase,
    private readonly getChildrenByGuardianUseCase: GetChildrenByGuardianUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: '아동 등록 (보호자)' })
  @ApiResponse({
    status: 201,
    description: '아동이 성공적으로 등록되었습니다',
    type: ChildResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 404, description: '보호자를 찾을 수 없음' })
  async registerChild(@Body() dto: RegisterChildDto): Promise<ChildResponseDto> {
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

  @Get('my-children')
  @ApiOperation({ summary: '내가 담당하는 아동 목록 조회 (로그인한 보호자)' })
  @ApiResponse({
    status: 200,
    description: '아동 목록',
    type: [ChildResponseDto],
  })
  async getMyChildren(@Request() req: any): Promise<ChildResponseDto[]> {
    // JWT에서 userId 추출
    const userId = req.user.userId;

    // userId로 GuardianProfile 조회 후 guardianId 획득 필요
    // 간단하게 userId를 guardianId로 사용 (실제로는 Guardian Repository 필요)
    return await this.getChildrenByGuardianUseCase.execute(userId);
  }
}
