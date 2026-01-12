import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * 시설 타입 (로그인용)
 */
export enum FacilityType {
  CARE_FACILITY = 'CARE_FACILITY',
  COMMUNITY_CENTER = 'COMMUNITY_CENTER',
  EDUCATION_WELFARE_SCHOOL = 'EDUCATION_WELFARE_SCHOOL',
}

/**
 * 시설 로그인 요청 DTO
 */
export class InstitutionLoginDto {
  @ApiProperty({ description: '시설 ID (UUID)' })
  @IsString()
  @IsNotEmpty()
  facilityId: string;

  @ApiProperty({ description: '시설 타입', enum: FacilityType })
  @IsEnum(FacilityType)
  facilityType: FacilityType;

  @ApiProperty({ description: '시설 비밀번호', example: '1234' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

/**
 * 시설 비밀번호 변경 요청 DTO
 */
export class ChangeInstitutionPasswordDto {
  @ApiProperty({ description: '시설 ID (UUID)' })
  @IsString()
  @IsNotEmpty()
  facilityId: string;

  @ApiProperty({ description: '시설 타입', enum: FacilityType })
  @IsEnum(FacilityType)
  facilityType: FacilityType;

  @ApiProperty({ description: '현재 비밀번호' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ description: '새 비밀번호 (최소 4자)', minLength: 4 })
  @IsString()
  @MinLength(4)
  newPassword: string;
}

/**
 * 시설 정보 응답 DTO (로그인 시설 선택용)
 */
export class FacilityInfoDto {
  @ApiProperty({ description: '시설 ID' })
  id: string;

  @ApiProperty({ description: '시설명' })
  name: string;

  @ApiProperty({ description: '시설 타입', enum: FacilityType })
  facilityType: FacilityType;

  @ApiProperty({ description: '구/군' })
  district: string;

  @ApiProperty({ description: '주소' })
  address: string;
}

/**
 * 시설 인증 응답 DTO
 */
export class InstitutionAuthResponseDto {
  @ApiProperty({ description: '액세스 토큰' })
  accessToken: string;

  @ApiProperty({ description: '리프레시 토큰' })
  refreshToken: string;

  @ApiProperty({ description: '시설 정보' })
  institution: {
    id: string;
    name: string;
    facilityType: FacilityType;
    district: string;
    isPasswordChanged: boolean;
  };
}
