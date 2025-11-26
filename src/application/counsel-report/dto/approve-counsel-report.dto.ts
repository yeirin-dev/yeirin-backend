import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * 면담결과지 승인 DTO
 *
 * @description
 * 보호자가 면담결과지를 확인하고 피드백을 작성하여 승인
 */
export class ApproveCounselReportDto {
  @ApiProperty({
    description: '보호자 피드백 (필수)',
    example:
      '상담 내용 잘 확인했습니다. 집에서도 아이의 감정 표현을 더 잘 들어주도록 노력하겠습니다. 다음 상담도 잘 부탁드립니다.',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  guardianFeedback: string;
}
