import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Public } from '@infrastructure/auth/decorators/public.decorator';
import { AssessmentSettingsEntity } from '@infrastructure/persistence/typeorm/entity/assessment-settings.entity';

/**
 * 검사 활성화 상태 응답 타입
 */
export interface AssessmentEnabledResponse {
  CRTES_R: boolean;
  SDQ_A: boolean;
  KPRC_CO_SG_E: boolean;
}

@ApiTags('설정')
@Controller('api/v1/settings')
export class SettingsController {
  constructor(
    @InjectRepository(AssessmentSettingsEntity)
    private readonly assessmentSettingsRepository: Repository<AssessmentSettingsEntity>,
  ) {}

  @Get('assessments/enabled')
  @Public()
  @ApiOperation({
    summary: '검사 활성화 상태 조회',
    description: '각 심리검사의 활성화/비활성화 상태를 조회합니다 (인증 불필요)',
  })
  @ApiResponse({
    status: 200,
    description: '검사 활성화 상태',
    schema: {
      type: 'object',
      properties: {
        CRTES_R: { type: 'boolean', example: true },
        SDQ_A: { type: 'boolean', example: false },
        KPRC_CO_SG_E: { type: 'boolean', example: true },
      },
    },
  })
  async getAssessmentEnabledStatus(): Promise<AssessmentEnabledResponse> {
    const settings = await this.assessmentSettingsRepository.find();

    // 기본값: 모두 활성화
    const defaultResponse: AssessmentEnabledResponse = {
      CRTES_R: true,
      SDQ_A: true,
      KPRC_CO_SG_E: true,
    };

    // DB에 설정이 없으면 기본값 반환
    if (settings.length === 0) {
      return defaultResponse;
    }

    // DB 설정값으로 응답 생성
    const response = { ...defaultResponse };
    for (const setting of settings) {
      if (setting.assessmentType in response) {
        response[setting.assessmentType as keyof AssessmentEnabledResponse] =
          setting.isEnabled;
      }
    }

    return response;
  }
}
