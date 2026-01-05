import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * 면담결과지 수정 DTO
 *
 * @description
 * DRAFT 상태에서만 수정 가능
 */
export class UpdateCounselReportDto {
  @ApiPropertyOptional({
    description: '상담 사유',
    example: 'ADHD 진단 후 집중력 향상을 위한 심리 상담',
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  counselReason?: string;

  @ApiPropertyOptional({
    description: '상담 내용 (구체적인 상담 진행 내용)',
    example: '아동과의 1:1 대화를 통해 최근 학교생활에서의 어려움을 탐색하였습니다.',
  })
  @IsOptional()
  @IsString()
  @MinLength(20)
  counselContent?: string;

  @ApiPropertyOptional({
    description: '센터(지역아동센터)에 전하는 피드백',
    example:
      '아동이 센터에서 또래 친구들과 긍정적인 관계를 형성할 수 있도록 집단 활동 참여를 권장해 주시기 바랍니다.',
  })
  @IsOptional()
  @IsString()
  centerFeedback?: string;

  @ApiPropertyOptional({
    description: '가정에 전하는 피드백',
    example:
      '가정에서 아동의 감정 표현을 충분히 경청해 주시고, 긍정적인 행동에 대해 즉각적인 칭찬을 해주시면 좋겠습니다.',
  })
  @IsOptional()
  @IsString()
  homeFeedback?: string;

  @ApiPropertyOptional({
    description: '상담사 서명 이미지 URL',
    example: 'https://s3.amazonaws.com/signatures/counselor-signature.png',
  })
  @IsOptional()
  @IsString()
  counselorSignature?: string;

  @ApiPropertyOptional({
    description: '첨부 파일 URL 목록 (이미지, PDF 등)',
    example: [
      'https://s3.amazonaws.com/reports/test-result-1.pdf',
      'https://s3.amazonaws.com/reports/drawing-therapy-1.jpg',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];
}
