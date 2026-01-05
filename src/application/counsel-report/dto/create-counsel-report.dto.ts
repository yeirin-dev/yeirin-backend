import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

/**
 * 면담결과지 생성 DTO
 *
 * @description
 * 상담사가 매 회차 상담 후 작성하는 면담결과지 생성
 */
export class CreateCounselReportDto {
  @ApiProperty({
    description: '상담의뢰지 ID (어떤 의뢰에 대한 결과지인지)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  counselRequestId: string;

  @ApiProperty({
    description: '아동 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsNotEmpty()
  childId: string;

  @ApiProperty({
    description: '회차 (1회차, 2회차, ...)',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  sessionNumber: number;

  @ApiProperty({
    description: '의뢰(작성)일자',
    example: '2025-01-15',
  })
  @Type(() => Date)
  @IsDate()
  reportDate: Date;

  @ApiProperty({
    description: '센터명',
    example: '행복한 심리상담센터',
  })
  @IsString()
  @MinLength(1)
  centerName: string;

  @ApiPropertyOptional({
    description: '상담사 서명 이미지 URL',
    example: 'https://s3.amazonaws.com/signatures/counselor-signature.png',
  })
  @IsOptional()
  @IsString()
  counselorSignature?: string;

  @ApiProperty({
    description: '상담 사유',
    example: 'ADHD 진단 후 집중력 향상을 위한 심리 상담',
  })
  @IsString()
  @MinLength(10)
  counselReason: string;

  @ApiProperty({
    description: '상담 내용 (구체적인 상담 진행 내용)',
    example:
      '아동과의 1:1 대화를 통해 최근 학교생활에서의 어려움을 탐색하였습니다. 특히 친구 관계에서 겪는 갈등 상황에 대해 집중적으로 다루었으며, 감정 조절 기법을 함께 연습하였습니다.',
  })
  @IsString()
  @MinLength(20)
  counselContent: string;

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
