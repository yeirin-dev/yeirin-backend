import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MatchingRecommendationResponseDto } from '@application/matching/dto/recommendation-result.dto';
import { RequestCounselorRecommendationDto } from '@application/matching/dto/request-counselor-recommendation.dto';
import { RequestCounselorRecommendationUseCase } from '@application/matching/use-case/request-counselor-recommendation.usecase';

/**
 * 상담 매칭 Controller
 */
@ApiTags('matching')
@Controller('api/v1/matching')
export class MatchingController {
  constructor(
    private readonly requestCounselorRecommendationUseCase: RequestCounselorRecommendationUseCase,
  ) {}

  /**
   * 상담기관 추천 요청 (인증 필요)
   * POST /api/v1/matching/recommendations
   */
  @Post('recommendations')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '상담기관 추천 요청 (인증 필요)',
    description: 'AI 기반으로 상담 의뢰지 텍스트를 분석하여 최적의 상담기관 5곳을 추천합니다.',
  })
  @ApiBody({
    type: RequestCounselorRecommendationDto,
    description: '상담 의뢰지 텍스트',
    examples: {
      adhd: {
        summary: 'ADHD 케이스',
        value: {
          counselRequestText:
            '7세 아들이 ADHD 진단을 받았습니다. 학교에서 집중하지 못하고 친구들과 자주 다툽니다. 전문적인 심리 상담과 행동 치료가 필요할 것 같아요.',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '추천 성공',
    type: MatchingRecommendationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (텍스트 길이 부족 등)',
  })
  @ApiResponse({
    status: 401,
    description: '인증 필요',
  })
  @ApiResponse({
    status: 500,
    description: '서버 오류 또는 AI 서비스 오류',
  })
  async requestRecommendation(
    @Body() dto: RequestCounselorRecommendationDto,
  ): Promise<MatchingRecommendationResponseDto> {
    return await this.requestCounselorRecommendationUseCase.execute(dto);
  }
}
