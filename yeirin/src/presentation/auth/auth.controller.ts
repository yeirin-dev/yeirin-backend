import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '@application/auth/auth.service';
import { AuthResponseDto } from '@application/auth/dto/auth-response.dto';
import { LoginDto } from '@application/auth/dto/login.dto';
import { RegisterCounselorDto } from '@application/auth/dto/register-counselor.dto';
import { RegisterGuardianDto } from '@application/auth/dto/register-guardian.dto';
import { RegisterInstitutionDto } from '@application/auth/dto/register-institution.dto';
import { RegisterDto } from '@application/auth/dto/register.dto';
import { Public } from '@infrastructure/auth/decorators/public.decorator';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';

@ApiTags('인증')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: '[DEPRECATED] 회원가입 - 역할별 엔드포인트 사용 권장',
    deprecated: true,
    description:
      '⚠️ 이 엔드포인트는 곧 제거될 예정입니다. 역할별 회원가입 엔드포인트를 사용하세요: /auth/register/guardian, /auth/register/institution, /auth/register/counselor',
  })
  @ApiResponse({ status: 201, description: '회원가입 성공', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: '이메일 중복' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return await this.authService.register(dto);
  }

  @Public()
  @Post('register/guardian')
  @ApiOperation({ summary: '보호자 회원가입 (User + GuardianProfile 동시 생성)' })
  @ApiResponse({ status: 201, description: '보호자 회원가입 성공', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: '이메일 중복 또는 회원가입 실패' })
  async registerGuardian(@Body() dto: RegisterGuardianDto): Promise<AuthResponseDto> {
    return await this.authService.registerGuardian(dto);
  }

  @Public()
  @Post('register/institution')
  @ApiOperation({ summary: '기관 대표 회원가입 (User + VoucherInstitution 동시 생성)' })
  @ApiResponse({ status: 201, description: '기관 회원가입 성공', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: '이메일 중복 또는 회원가입 실패' })
  async registerInstitution(@Body() dto: RegisterInstitutionDto): Promise<AuthResponseDto> {
    return await this.authService.registerInstitution(dto);
  }

  @Public()
  @Post('register/counselor')
  @ApiOperation({ summary: '상담사 회원가입 (User + CounselorProfile 동시 생성)' })
  @ApiResponse({ status: 201, description: '상담사 회원가입 성공', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: '이메일 중복 또는 회원가입 실패' })
  async registerCounselor(@Body() dto: RegisterCounselorDto): Promise<AuthResponseDto> {
    return await this.authService.registerCounselor(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return await this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '액세스 토큰 갱신' })
  @ApiResponse({ status: 200, description: '토큰 갱신 성공' })
  @ApiResponse({ status: 401, description: '유효하지 않은 리프레시 토큰' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return await this.authService.refresh(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({ status: 204, description: '로그아웃 성공' })
  async logout(@Request() req: any) {
    await this.authService.logout(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 사용자 정보 조회' })
  @ApiResponse({ status: 200, description: '사용자 정보 조회 성공' })
  async getMe(@Request() req: any) {
    return req.user;
  }
}
