import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * 시설 기반 JWT Payload
 * - 아동양육시설(CARE_FACILITY), 지역아동센터(COMMUNITY_CENTER), 교육복지사협회 학교(EDUCATION_WELFARE_SCHOOL) 인증
 */
export interface InstitutionJwtPayload {
  sub: string; // facility id
  facilityType: 'CARE_FACILITY' | 'COMMUNITY_CENTER' | 'EDUCATION_WELFARE_SCHOOL';
  facilityName: string;
  district: string;
  role: 'INSTITUTION';
  isPasswordChanged: boolean;
  iat?: number; // issued at (optional)
  exp?: number; // expiration (optional)
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', 'your-secret-key-change-this'),
    });
  }

  async validate(payload: InstitutionJwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }

    if (payload.role !== 'INSTITUTION' || !payload.facilityType) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }

    return {
      userId: payload.sub, // facilityId를 userId로 매핑 (기존 API 호환)
      institutionId: payload.sub,
      facilityType: payload.facilityType,
      facilityName: payload.facilityName,
      district: payload.district,
      role: payload.role,
      isPasswordChanged: payload.isPasswordChanged,
    };
  }
}
