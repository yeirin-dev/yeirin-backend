import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * 지역아동센터 생성 DTO
 */
export class CreateCommunityChildCenterDto {
  @ApiProperty({
    description: '기관명',
    example: '행복지역아동센터',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: '주소',
    example: '서울특별시 마포구 상암로 123',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address: string;

  @ApiProperty({
    description: '상세주소 (선택)',
    example: '2층',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  addressDetail?: string;

  @ApiProperty({
    description: '우편번호 (선택)',
    example: '03925',
    maxLength: 10,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  postalCode?: string;

  @ApiProperty({
    description: '센터장명',
    example: '김영희',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  directorName: string;

  @ApiProperty({
    description: '연락처 (선택)',
    example: '02-9876-5432',
    maxLength: 20,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiProperty({
    description: '정원 (수용 가능 아동 수, 선택)',
    example: 30,
    minimum: 1,
    maximum: 300,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(300)
  capacity?: number;

  @ApiProperty({
    description: '설립일 (YYYY-MM-DD, 선택)',
    example: '2018-03-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  establishedDate?: string;

  @ApiProperty({
    description: '기관 소개 (선택)',
    example: '지역 아동들의 방과후 돌봄을 제공합니다',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  introduction?: string;

  @ApiProperty({
    description: '운영 시간 (선택)',
    example: '평일 14:00-19:00',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  operatingHours?: string;
}
