import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

/**
 * 사용자 정지 요청 DTO
 */
export class AdminBanUserDto {
  @ApiProperty({
    description: '정지 사유',
    example: '서비스 이용약관 위반',
    minLength: 10,
    maxLength: 500,
  })
  @IsNotEmpty({ message: '정지 사유는 필수입니다' })
  @IsString()
  @MinLength(10, { message: '정지 사유는 최소 10자 이상이어야 합니다' })
  @MaxLength(500, { message: '정지 사유는 최대 500자까지 입력 가능합니다' })
  reason: string;
}
