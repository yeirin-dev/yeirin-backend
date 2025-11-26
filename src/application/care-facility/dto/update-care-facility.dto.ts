import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * 양육시설 수정 DTO
 */
export class UpdateCareFacilityDto {
  @ApiProperty({
    description: '기관명',
    example: '사랑양육시설',
    minLength: 2,
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: '주소',
    example: '서울특별시 강남구 테헤란로 123',
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiProperty({
    description: '상세주소',
    example: '3층 301호',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  addressDetail?: string;

  @ApiProperty({
    description: '우편번호',
    example: '06234',
    maxLength: 10,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  postalCode?: string;

  @ApiProperty({
    description: '대표자명',
    example: '김철수',
    minLength: 2,
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  representativeName?: string;

  @ApiProperty({
    description: '연락처',
    example: '02-1234-5678',
    maxLength: 20,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiProperty({
    description: '정원 (수용 가능 아동 수)',
    example: 50,
    minimum: 1,
    maximum: 500,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  capacity?: number;

  @ApiProperty({
    description: '기관 소개',
    example: '아동복지법에 따른 양육시설로 보호가 필요한 아동을 양육합니다.',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  introduction?: string;

  @ApiProperty({
    description: '활성화 여부',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
