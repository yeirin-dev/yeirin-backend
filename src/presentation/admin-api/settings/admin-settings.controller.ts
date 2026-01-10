import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Roles } from '@infrastructure/auth/decorators/roles.decorator';
import {
  AdminPermissionGuard,
  AdminPermissions,
  AdminAuditInterceptor,
  ADMIN_PERMISSIONS,
} from '@yeirin/admin-common';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { AssessmentSettingsEntity } from '@infrastructure/persistence/typeorm/entity/assessment-settings.entity';
import {
  UpdateAssessmentSettingsDto,
  AssessmentSettingsResponseDto,
} from './dto/assessment-settings.dto';

@ApiTags('Admin - 시스템 설정')
@Controller('admin/settings')
@UseGuards(AdminJwtAuthGuard, AdminPermissionGuard)
@UseInterceptors(AdminAuditInterceptor)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminSettingsController {
  constructor(
    @InjectRepository(AssessmentSettingsEntity)
    private readonly assessmentSettingsRepository: Repository<AssessmentSettingsEntity>,
  ) {}

  @Get('assessments')
  @AdminPermissions(ADMIN_PERMISSIONS.SYSTEM_MANAGE)
  @ApiOperation({ summary: '검사 설정 조회' })
  @ApiResponse({
    status: 200,
    description: '검사 설정 목록',
    type: [AssessmentSettingsResponseDto],
  })
  async getAssessmentSettings(): Promise<AssessmentSettingsResponseDto[]> {
    const settings = await this.assessmentSettingsRepository.find({
      order: { assessmentType: 'ASC' },
    });

    // 설정이 없으면 기본값으로 초기화
    if (settings.length === 0) {
      await this.initializeDefaultSettings();
      return this.assessmentSettingsRepository.find({
        order: { assessmentType: 'ASC' },
      });
    }

    return settings;
  }

  @Put('assessments')
  @AdminPermissions(ADMIN_PERMISSIONS.SYSTEM_MANAGE)
  @ApiOperation({ summary: '검사 설정 업데이트' })
  @ApiResponse({
    status: 200,
    description: '업데이트된 검사 설정 목록',
    type: [AssessmentSettingsResponseDto],
  })
  async updateAssessmentSettings(
    @Body() dto: UpdateAssessmentSettingsDto,
  ): Promise<AssessmentSettingsResponseDto[]> {
    const assessmentTypes = dto.settings.map((s) => s.assessmentType);
    const existingSettings = await this.assessmentSettingsRepository.find({
      where: { assessmentType: In(assessmentTypes) },
    });

    for (const setting of dto.settings) {
      const existing = existingSettings.find(
        (s) => s.assessmentType === setting.assessmentType,
      );
      if (existing) {
        existing.isEnabled = setting.isEnabled;
        await this.assessmentSettingsRepository.save(existing);
      }
    }

    return this.assessmentSettingsRepository.find({
      order: { assessmentType: 'ASC' },
    });
  }

  /**
   * 기본 검사 설정 초기화
   */
  private async initializeDefaultSettings(): Promise<void> {
    const defaultSettings = [
      {
        assessmentType: 'CRTES_R',
        displayName: '아동 외상 반응 척도 (CRTES-R)',
        isEnabled: true,
      },
      {
        assessmentType: 'SDQ_A',
        displayName: '강점·난점 설문지 (SDQ-A)',
        isEnabled: true,
      },
      {
        assessmentType: 'KPRC_CO_SG_E',
        displayName: '한국아동인성평정척도 (KPRC)',
        isEnabled: true,
      },
    ];

    for (const setting of defaultSettings) {
      const entity = this.assessmentSettingsRepository.create(setting);
      await this.assessmentSettingsRepository.save(entity);
    }
  }
}
