import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { BImpactVoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/b-impact-voucher-institution.entity';
import { FacilityType } from './dto/institution-auth.dto';
import {
  BImpactAuthResponseDto,
  BImpactInstitutionInfoDto,
  BImpactInstitutionLoginDto,
  ChangeBImpactPasswordDto,
} from './dto/b-impact-institution-auth.dto';

/**
 * B-IMPACT 기관 인증 서비스
 */
@Injectable()
export class BImpactInstitutionAuthService {
  constructor(
    @InjectRepository(BImpactVoucherInstitutionEntity)
    private readonly bImpactRepository: Repository<BImpactVoucherInstitutionEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * B-IMPACT 기관의 구/군 목록 조회
   */
  async getDistricts(): Promise<string[]> {
    const districts = await this.bImpactRepository
      .createQueryBuilder('institution')
      .select('DISTINCT institution.district', 'district')
      .where('institution.isActive = :isActive', { isActive: true })
      .getRawMany<{ district: string }>();

    return districts.map((d) => d.district).sort();
  }

  /**
   * 구/군별 B-IMPACT 기관 목록 조회
   */
  async getInstitutionsByDistrict(district: string): Promise<BImpactInstitutionInfoDto[]> {
    if (!district || district.trim() === '') {
      return [];
    }

    const institutions = await this.bImpactRepository.find({
      where: { district: district.trim(), isActive: true },
      order: { name: 'ASC' },
    });

    return institutions.map((inst) => ({
      id: inst.id,
      name: inst.name,
      district: inst.district,
      address: inst.address,
    }));
  }

  /**
   * B-IMPACT 기관 로그인
   */
  async login(dto: BImpactInstitutionLoginDto): Promise<BImpactAuthResponseDto> {
    const institution = await this.bImpactRepository.findOne({
      where: { id: dto.institutionId, isActive: true },
    });

    if (!institution) {
      throw new UnauthorizedException('기관을 찾을 수 없습니다');
    }

    if (!institution.password) {
      throw new UnauthorizedException('비밀번호가 설정되지 않은 기관입니다');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, institution.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다');
    }

    const { accessToken, refreshToken } = await this.generateTokens(
      institution.id,
      institution.name,
      institution.district,
      institution.isPasswordChanged,
    );

    return {
      accessToken,
      refreshToken,
      institution: {
        id: institution.id,
        name: institution.name,
        facilityType: FacilityType.B_IMPACT_INSTITUTION,
        district: institution.district,
        isPasswordChanged: institution.isPasswordChanged,
      },
    };
  }

  /**
   * B-IMPACT 기관 비밀번호 변경
   */
  async changePassword(dto: ChangeBImpactPasswordDto): Promise<BImpactAuthResponseDto> {
    const institution = await this.bImpactRepository.findOne({
      where: { id: dto.institutionId, isActive: true },
    });

    if (!institution) {
      throw new UnauthorizedException('기관을 찾을 수 없습니다');
    }

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, institution.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    institution.password = hashedPassword;
    institution.isPasswordChanged = true;
    await this.bImpactRepository.save(institution);

    const { accessToken, refreshToken } = await this.generateTokens(
      institution.id,
      institution.name,
      institution.district,
      true,
    );

    return {
      accessToken,
      refreshToken,
      institution: {
        id: institution.id,
        name: institution.name,
        facilityType: FacilityType.B_IMPACT_INSTITUTION,
        district: institution.district,
        isPasswordChanged: true,
      },
    };
  }

  /**
   * 리프레시 토큰으로 새 액세스 토큰 발급
   */
  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET', 'your-refresh-secret-change-this'),
      });

      if (payload.facilityType !== FacilityType.B_IMPACT_INSTITUTION) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다');
      }

      const institution = await this.bImpactRepository.findOne({
        where: { id: payload.sub, isActive: true },
      });

      if (!institution) {
        throw new UnauthorizedException('기관을 찾을 수 없습니다');
      }

      const accessToken = this.jwtService.sign(
        {
          sub: institution.id,
          facilityType: FacilityType.B_IMPACT_INSTITUTION,
          facilityName: institution.name,
          district: institution.district,
          role: 'INSTITUTION',
          isPasswordChanged: institution.isPasswordChanged,
        },
        {
          secret: this.configService.get('JWT_SECRET', 'your-secret-key-change-this'),
          expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION', '24h'),
        },
      );

      return { accessToken };
    } catch {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다');
    }
  }

  /**
   * 현재 로그인 기관 정보 조회
   */
  async getMe(institutionId: string): Promise<BImpactInstitutionInfoDto> {
    const institution = await this.bImpactRepository.findOne({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new UnauthorizedException('기관을 찾을 수 없습니다');
    }

    return {
      id: institution.id,
      name: institution.name,
      district: institution.district,
      address: institution.address,
    };
  }

  /**
   * JWT 토큰 생성
   */
  private async generateTokens(
    institutionId: string,
    facilityName: string,
    district: string,
    isPasswordChanged: boolean,
  ) {
    const payload = {
      sub: institutionId,
      facilityType: FacilityType.B_IMPACT_INSTITUTION,
      facilityName,
      district,
      role: 'INSTITUTION',
      isPasswordChanged,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET', 'your-secret-key-change-this'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION', '24h'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET', 'your-refresh-secret-change-this'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}
