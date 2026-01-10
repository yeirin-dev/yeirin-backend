import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Admin JWT Payload
 */
export interface AdminJwtPayload {
  sub: string;
  role: 'ADMIN';
  iat?: number;
  exp?: number;
}

/**
 * Admin Auth Service
 *
 * 관리자 인증 서비스
 * - 환경변수 기반 비밀번호 검증
 * - JWT 토큰 발급
 */
@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);
  private readonly adminPassword: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.adminPassword = this.configService.get<string>('ADMIN_PASSWORD', 'yeirin-admin-2024');
  }

  /**
   * 관리자 로그인
   */
  async login(password: string): Promise<{ token: string }> {
    if (!this.validatePassword(password)) {
      this.logger.warn('관리자 로그인 실패: 비밀번호 불일치');
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다');
    }

    const payload: AdminJwtPayload = {
      sub: 'admin',
      role: 'ADMIN',
    };

    const token = this.jwtService.sign(payload);

    this.logger.log('관리자 로그인 성공');

    return { token };
  }

  /**
   * 비밀번호 검증
   */
  private validatePassword(password: string): boolean {
    return password === this.adminPassword;
  }

  /**
   * Admin JWT 토큰 검증
   */
  async validateToken(token: string): Promise<AdminJwtPayload | null> {
    try {
      const payload = this.jwtService.verify<AdminJwtPayload>(token);
      if (payload.role !== 'ADMIN') {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }
}
