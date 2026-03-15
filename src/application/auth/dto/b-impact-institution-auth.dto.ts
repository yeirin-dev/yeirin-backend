import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * B-IMPACT 기관 로그인 요청 DTO
 */
export class BImpactInstitutionLoginDto {
  @ApiProperty({ description: 'B-IMPACT 기관 ID (UUID)' })
  @IsString()
  @IsNotEmpty()
  institutionId: string;

  @ApiProperty({ description: '기관 비밀번호', example: '1234' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

/**
 * B-IMPACT 기관 비밀번호 변경 요청 DTO
 */
export class ChangeBImpactPasswordDto {
  @ApiProperty({ description: 'B-IMPACT 기관 ID (UUID)' })
  @IsString()
  @IsNotEmpty()
  institutionId: string;

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
 * B-IMPACT 기관 정보 응답 DTO
 */
export class BImpactInstitutionInfoDto {
  @ApiProperty({ description: '기관 ID' })
  id: string;

  @ApiProperty({ description: '기관명' })
  name: string;

  @ApiProperty({ description: '구/군' })
  district: string;

  @ApiProperty({ description: '주소' })
  address: string;
}

/**
 * B-IMPACT 인증 응답 DTO
 */
export class BImpactAuthResponseDto {
  @ApiProperty({ description: '액세스 토큰' })
  accessToken: string;

  @ApiProperty({ description: '리프레시 토큰' })
  refreshToken: string;

  @ApiProperty({ description: '기관 정보' })
  institution: {
    id: string;
    name: string;
    facilityType: string;
    district: string;
    isPasswordChanged: boolean;
  };
}
