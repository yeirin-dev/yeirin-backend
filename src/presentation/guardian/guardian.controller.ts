import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GuardianDashboardDto } from '@application/guardian/dto/guardian-dashboard.dto';
import { GetGuardianDashboardUseCase } from '@application/guardian/use-cases/get-guardian-dashboard.usecase';
import {
  CurrentUser,
  CurrentUserData,
} from '@infrastructure/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';

@ApiTags('보호자')
@Controller('api/v1/guardian')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GuardianController {
  constructor(private readonly getGuardianDashboardUseCase: GetGuardianDashboardUseCase) {}

  @Get('dashboard')
  @ApiOperation({
    summary: '보호자 대시보드 통계 조회',
    description: '현재 로그인한 보호자의 대시보드 통계를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '대시보드 통계 조회 성공',
    type: GuardianDashboardDto,
  })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async getDashboard(@CurrentUser() user: CurrentUserData): Promise<GuardianDashboardDto> {
    return await this.getGuardianDashboardUseCase.execute(user.userId);
  }
}
