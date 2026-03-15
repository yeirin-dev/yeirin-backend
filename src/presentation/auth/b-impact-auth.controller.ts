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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BImpactInstitutionAuthService } from '@application/auth/b-impact-institution-auth.service';
import {
  BImpactAuthResponseDto,
  BImpactInstitutionInfoDto,
  BImpactInstitutionLoginDto,
  ChangeBImpactPasswordDto,
} from '@application/auth/dto/b-impact-institution-auth.dto';
import {
  CurrentUser,
  CurrentUserData,
} from '@infrastructure/auth/decorators/current-user.decorator';
import { Public } from '@infrastructure/auth/decorators/public.decorator';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';

@ApiTags('B-IMPACT 기관 인증')
@Controller('api/v1/auth/b-impact')
export class BImpactAuthController {
  constructor(private readonly bImpactAuthService: BImpactInstitutionAuthService) {}

  @Public()
  @Get('districts')
  @ApiOperation({ summary: 'B-IMPACT 기관 구/군 목록 조회' })
  @ApiResponse({ status: 200, description: '구/군 목록', type: [String] })
  async getDistricts(): Promise<string[]> {
    return await this.bImpactAuthService.getDistricts();
  }

  @Public()
  @Get('institutions')
  @ApiOperation({ summary: '구/군별 B-IMPACT 기관 목록 조회' })
  @ApiQuery({ name: 'district', required: true, description: '구/군명' })
  @ApiResponse({ status: 200, description: '기관 목록', type: [BImpactInstitutionInfoDto] })
  async getInstitutions(
    @Query('district') district: string,
  ): Promise<BImpactInstitutionInfoDto[]> {
    return await this.bImpactAuthService.getInstitutionsByDistrict(district);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'B-IMPACT 기관 로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공', type: BImpactAuthResponseDto })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async login(@Body() dto: BImpactInstitutionLoginDto): Promise<BImpactAuthResponseDto> {
    return await this.bImpactAuthService.login(dto);
  }

  @Public()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'B-IMPACT 기관 비밀번호 변경' })
  @ApiResponse({ status: 200, description: '비밀번호 변경 성공', type: BImpactAuthResponseDto })
  @ApiResponse({ status: 401, description: '현재 비밀번호 불일치' })
  async changePassword(@Body() dto: ChangeBImpactPasswordDto): Promise<BImpactAuthResponseDto> {
    return await this.bImpactAuthService.changePassword(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'B-IMPACT 기관 토큰 갱신' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { refreshToken: { type: 'string', description: '리프레시 토큰' } },
      required: ['refreshToken'],
    },
  })
  @ApiResponse({ status: 200, description: '토큰 갱신 성공' })
  @ApiResponse({ status: 401, description: '유효하지 않은 리프레시 토큰' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return await this.bImpactAuthService.refresh(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 B-IMPACT 기관 정보 조회' })
  @ApiResponse({ status: 200, description: '기관 정보 조회 성공' })
  async getMe(@CurrentUser() user: CurrentUserData) {
    return {
      id: user.institutionId,
      facilityType: user.facilityType,
      facilityName: user.facilityName,
      district: user.district,
      isPasswordChanged: user.isPasswordChanged,
    };
  }
}
