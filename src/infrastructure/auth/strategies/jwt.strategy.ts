import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * 사용자 기반 JWT Payload (기존 로그인)
 */
export interface UserJwtPayload {
  sub: string; // user id
  email: string;
  role: string;
}

/**
 * 시설 기반 JWT Payload (새 로그인)
 */
export interface InstitutionJwtPayload {
  sub: string; // facility id
  facilityType: 'CARE_FACILITY' | 'COMMUNITY_CENTER';
  facilityName: string;
  district: string;
  role: 'INSTITUTION';
  isPasswordChanged: boolean;
}

/**
 * 통합 JWT Payload
 */
export type JwtPayload = UserJwtPayload | InstitutionJwtPayload;

/**
 * Payload가 시설 기반인지 확인
 */
function isInstitutionPayload(payload: JwtPayload): payload is InstitutionJwtPayload {
  return payload.role === 'INSTITUTION' && 'facilityType' in payload;
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

  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }

    // 시설 기반 인증
    if (isInstitutionPayload(payload)) {
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

    // 사용자 기반 인증 (기존)
    if (!payload.email) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
