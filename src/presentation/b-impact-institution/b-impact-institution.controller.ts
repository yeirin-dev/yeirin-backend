import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetLinkedChildrenUseCase, LinkedChildItem } from '@application/b-impact-institution/use-cases/get-linked-children.usecase';
import { AcceptLinkageUseCase } from '@application/b-impact-institution/use-cases/accept-linkage.usecase';
import { RejectLinkageUseCase } from '@application/b-impact-institution/use-cases/reject-linkage.usecase';
import {
  CurrentUser,
  CurrentUserData,
} from '@infrastructure/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';

@ApiTags('B-IMPACT 기관 콘솔')
@Controller('api/v1/b-impact-institution')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BImpactInstitutionController {
  constructor(
    private readonly getLinkedChildrenUseCase: GetLinkedChildrenUseCase,
    private readonly acceptLinkageUseCase: AcceptLinkageUseCase,
    private readonly rejectLinkageUseCase: RejectLinkageUseCase,
  ) {}

  private validateBImpactInstitution(user: CurrentUserData): void {
    if (user.facilityType !== 'B_IMPACT_INSTITUTION') {
      throw new ForbiddenException('B-IMPACT 기관 종사자만 접근할 수 있습니다');
    }
  }

  @Get('linked-children')
  @ApiOperation({ summary: '연계 아동 목록 조회' })
  @ApiResponse({ status: 200, description: '연계 아동 목록' })
  @ApiResponse({ status: 403, description: 'B-IMPACT 기관 종사자만 접근 가능' })
  async getLinkedChildren(@CurrentUser() user: CurrentUserData): Promise<LinkedChildItem[]> {
    this.validateBImpactInstitution(user);
    return await this.getLinkedChildrenUseCase.execute(user.institutionId);
  }

  @Post('linkages/:id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '연계 수락' })
  @ApiParam({ name: 'id', description: '연계(VoucherLinkage) ID' })
  @ApiResponse({ status: 200, description: '연계 수락 성공' })
  @ApiResponse({ status: 403, description: 'B-IMPACT 기관 종사자만 접근 가능' })
  @ApiResponse({ status: 404, description: '연계를 찾을 수 없음' })
  async acceptLinkage(
    @Param('id') linkageId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ success: boolean }> {
    this.validateBImpactInstitution(user);
    await this.acceptLinkageUseCase.execute(linkageId, user.institutionId);
    return { success: true };
  }

  @Post('linkages/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '연계 거절' })
  @ApiParam({ name: 'id', description: '연계(VoucherLinkage) ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { reason: { type: 'string', description: '거절 사유', example: '해당 아동에 대한 상담 역량이 부족합니다' } },
      required: ['reason'],
    },
  })
  @ApiResponse({ status: 200, description: '연계 거절 성공' })
  @ApiResponse({ status: 403, description: 'B-IMPACT 기관 종사자만 접근 가능' })
  @ApiResponse({ status: 404, description: '연계를 찾을 수 없음' })
  async rejectLinkage(
    @Param('id') linkageId: string,
    @Body('reason') reason: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ success: boolean }> {
    this.validateBImpactInstitution(user);
    await this.rejectLinkageUseCase.execute(linkageId, user.institutionId, reason);
    return { success: true };
  }
}
