import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { UserRoleType } from '@domain/user/model/value-objects/user-role.vo';

/**
 * 회원가입 DTO (Presentation Layer)
 */
export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: '이메일' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  email: string;

  @ApiProperty({ example: 'Test1234!@#', description: '비밀번호 (최소 8자, 영문+숫자+특수문자)' })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
  @MaxLength(100, { message: '비밀번호는 최대 100자까지 가능합니다' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/, {
    message: '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다',
  })
  password: string;

  @ApiProperty({ example: '홍길동', description: '실명' })
  @IsString()
  @MinLength(2, { message: '이름은 최소 2자 이상이어야 합니다' })
  @MaxLength(50, { message: '이름은 최대 50자까지 가능합니다' })
  realName: string;

  @ApiProperty({ example: '010-1234-5678', description: '전화번호' })
  @IsString()
  @Matches(/^010-?\d{4}-?\d{4}$/, {
    message: '올바른 전화번호 형식이 아닙니다 (010-xxxx-xxxx)',
  })
  phoneNumber: string;

  @ApiProperty({
    example: 'GUARDIAN',
    description: '사용자 역할',
    enum: ['GUARDIAN', 'INSTITUTION_ADMIN', 'COUNSELOR', 'ADMIN'],
  })
  @IsEnum(['GUARDIAN', 'INSTITUTION_ADMIN', 'COUNSELOR', 'ADMIN'], {
    message: '유효하지 않은 역할입니다',
  })
  role: UserRoleType;
}
