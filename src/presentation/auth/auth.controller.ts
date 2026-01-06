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
import {
  ChangeInstitutionPasswordDto,
  FacilityInfoDto,
  FacilityType,
  InstitutionAuthResponseDto,
  InstitutionLoginDto,
} from '@application/auth/dto/institution-auth.dto';
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
  constructor(private readonly institutionAuthService: InstitutionAuthService) {}

  // =========================================================================
  // 시설 인증 API (구/군 → 시설 → 비밀번호)
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

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 시설 정보 조회' })
  @ApiResponse({ status: 200, description: '시설 정보 조회 성공' })
  async getMe(@CurrentUser() user: CurrentUserData) {
    // 기관 기반 인증 - 시설 정보 반환
    return {
      id: user.institutionId,
      facilityType: user.facilityType,
      facilityName: user.facilityName,
      district: user.district,
      isPasswordChanged: user.isPasswordChanged,
    };
  }
}
