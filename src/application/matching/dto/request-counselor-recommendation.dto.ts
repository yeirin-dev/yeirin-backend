import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 상담기관 추천 요청 DTO
 */
export class RequestCounselorRecommendationDto {
  /**
   * 상담의뢰지 텍스트 (최소 10자, 최대 5000자)
   */
  @ApiProperty({
    description: '상담 의뢰지 텍스트 (최소 10자, 최대 5000자)',
    example:
      '7세 아들이 ADHD 진단을 받았습니다. 학교에서 집중하지 못하고 친구들과 자주 다툽니다. 전문적인 심리 상담과 행동 치료가 필요할 것 같아요.',
    minLength: 10,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  counselRequestText: string;
}
