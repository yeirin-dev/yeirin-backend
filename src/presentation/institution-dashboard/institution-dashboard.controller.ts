import { Controller, Get, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InstitutionDashboardResponseDto } from '@application/institution-dashboard/dto/institution-dashboard-response.dto';
import { GetInstitutionDashboardUseCase } from '@application/institution-dashboard/use-case/get-institution-dashboard.usecase';
import {
  CurrentUser,
  CurrentUserData,
} from '@infrastructure/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';

/**
 * 시설 대시보드 Controller
 *
 * 시설 로그인 후 대시보드 정보를 조회합니다.
 */
@ApiTags('시설 대시보드')
@Controller('api/v1/institution/dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InstitutionDashboardController {
  constructor(private readonly getInstitutionDashboardUseCase: GetInstitutionDashboardUseCase) {}

  @Get()
  @ApiOperation({
    summary: '시설 대시보드 조회',
    description: `
시설 로그인 후 대시보드 정보를 조회합니다.
- 소속 아동 수
- 상담의뢰 상태별 통계 (대기중, 매칭완료, 진행중, 완료)
- 최근 활동 목록 (최근 10건)
    `,
  })
  @ApiResponse({
    status: 200,
    description: '대시보드 정보',
    type: InstitutionDashboardResponseDto,
  })
  @ApiResponse({ status: 403, description: '시설 로그인 필요' })
  async getDashboard(
    @CurrentUser() user: CurrentUserData,
  ): Promise<InstitutionDashboardResponseDto> {
    // 시설 인증인지 확인
    if (user.role !== 'INSTITUTION' || !user.facilityType || !user.institutionId) {
      throw new ForbiddenException('시설 로그인이 필요합니다.');
    }

    return this.getInstitutionDashboardUseCase.execute({
      institutionId: user.institutionId,
      facilityType: user.facilityType,
    });
  }
}
