import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Public } from '@infrastructure/auth/decorators/public.decorator';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto, AdminLoginResponseDto } from './dto/admin-login.dto';

/**
 * Admin Auth Controller
 *
 * 관리자 인증 API
 * @route /admin/auth
 */
@ApiTags('Admin - 인증')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  /**
   * 관리자 로그인
   *
   * 환경변수에 설정된 관리자 비밀번호로 로그인
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '관리자 로그인',
    description: '관리자 비밀번호를 입력하여 JWT 토큰을 발급받습니다.',
  })
  @ApiBody({ type: AdminLoginDto })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    type: AdminLoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '비밀번호 불일치',
  })
  async login(@Body() dto: AdminLoginDto): Promise<AdminLoginResponseDto> {
    return this.adminAuthService.login(dto.password);
  }
}
