import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '@application/auth/auth.service';
import { AuthResponseDto } from '@application/auth/dto/auth-response.dto';
import {
  ChangeInstitutionPasswordDto,
  FacilityInfoDto,
  FacilityType,
  InstitutionAuthResponseDto,
  InstitutionLoginDto,
} from '@application/auth/dto/institution-auth.dto';
import { LoginDto } from '@application/auth/dto/login.dto';
import { RegisterCounselorDto } from '@application/auth/dto/register-counselor.dto';
import { RegisterInstitutionDto } from '@application/auth/dto/register-institution.dto';
import { RegisterDto } from '@application/auth/dto/register.dto';
import { InstitutionAuthService } from '@application/auth/institution-auth.service';
import {
  CurrentUser,
  CurrentUserData,
} from '@infrastructure/auth/decorators/current-user.decorator';
import { Public } from '@infrastructure/auth/decorators/public.decorator';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';

@ApiTags('인증')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly institutionAuthService: InstitutionAuthService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: '[DEPRECATED] 회원가입 - 역할별 엔드포인트 사용 권장',
    deprecated: true,
    description:
      '⚠️ 이 엔드포인트는 곧 제거될 예정입니다. 역할별 회원가입 엔드포인트를 사용하세요: /auth/register/institution, /auth/register/counselor',
  })
  @ApiResponse({ status: 201, description: '회원가입 성공', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: '이메일 중복' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return await this.authService.register(dto);
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
  async logout(@CurrentUser('userId') userId: string) {
    await this.authService.logout(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 사용자 정보 조회' })
  @ApiResponse({ status: 200, description: '사용자 정보 조회 성공' })
  async getMe(@CurrentUser() user: CurrentUserData) {
    // 프론트엔드 User 타입과 호환되도록 userId를 id로 매핑
    return {
      id: user.userId,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
    };
  }

  // =========================================================================
  // 시설 인증 API (새 로그인 플로우: 구/군 → 시설 → 비밀번호)
  // =========================================================================

  @Public()
  @Get('districts')
  @ApiOperation({ summary: '구/군 목록 조회 (시설 로그인용)' })
  @ApiResponse({ status: 200, description: '구/군 목록', type: [String] })
  async getDistricts(): Promise<string[]> {
    return await this.institutionAuthService.getDistricts();
  }

  @Public()
  @Get('facilities')
  @ApiOperation({ summary: '구/군별 시설 목록 조회 (시설 로그인용)' })
  @ApiQuery({ name: 'district', required: true, description: '구/군명' })
  @ApiQuery({
    name: 'facilityType',
    required: false,
    enum: FacilityType,
    description: '시설 타입 (미입력 시 전체)',
  })
  @ApiResponse({ status: 200, description: '시설 목록', type: [FacilityInfoDto] })
  async getFacilities(
    @Query('district') district: string,
    @Query('facilityType') facilityType?: FacilityType,
  ): Promise<FacilityInfoDto[]> {
    return await this.institutionAuthService.getFacilitiesByDistrict(district, facilityType);
  }

  @Public()
  @Post('institution/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '시설 로그인 (비밀번호 인증)' })
  @ApiResponse({ status: 200, description: '시설 로그인 성공', type: InstitutionAuthResponseDto })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async institutionLogin(@Body() dto: InstitutionLoginDto): Promise<InstitutionAuthResponseDto> {
    return await this.institutionAuthService.login(dto);
  }

  @Public()
  @Post('institution/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '시설 비밀번호 변경 (첫 로그인 시 필수)' })
  @ApiResponse({ status: 200, description: '비밀번호 변경 성공', type: InstitutionAuthResponseDto })
  @ApiResponse({ status: 401, description: '현재 비밀번호 불일치' })
  async changeInstitutionPassword(
    @Body() dto: ChangeInstitutionPasswordDto,
  ): Promise<InstitutionAuthResponseDto> {
    return await this.institutionAuthService.changePassword(dto);
  }

  @Public()
  @Post('institution/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '시설 액세스 토큰 갱신' })
  @ApiResponse({ status: 200, description: '토큰 갱신 성공' })
  @ApiResponse({ status: 401, description: '유효하지 않은 리프레시 토큰' })
  async institutionRefresh(@Body('refreshToken') refreshToken: string) {
    return await this.institutionAuthService.refresh(refreshToken);
  }
}
