import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CareFacilityEntity } from '@infrastructure/persistence/typeorm/entity/care-facility.entity';
import { CommunityChildCenterEntity } from '@infrastructure/persistence/typeorm/entity/community-child-center.entity';
import { EducationWelfareSchoolEntity } from '@infrastructure/persistence/typeorm/entity/education-welfare-school.entity';
import {
  ChangeInstitutionPasswordDto,
  FacilityInfoDto,
  FacilityType,
  InstitutionAuthResponseDto,
  InstitutionLoginDto,
} from './dto/institution-auth.dto';

/**
 * 시설 인증 서비스 (Application Layer)
 * - 시설 로그인 (구/군 → 시설 선택 → 비밀번호)
 * - 비밀번호 변경
 */
@Injectable()
export class InstitutionAuthService {
  constructor(
    @InjectRepository(CareFacilityEntity)
    private readonly careFacilityRepository: Repository<CareFacilityEntity>,
    @InjectRepository(CommunityChildCenterEntity)
    private readonly communityChildCenterRepository: Repository<CommunityChildCenterEntity>,
    @InjectRepository(EducationWelfareSchoolEntity)
    private readonly educationWelfareSchoolRepository: Repository<EducationWelfareSchoolEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 구/군 목록 조회 (세 시설 타입 통합)
   */
  async getDistricts(): Promise<string[]> {
    // CareFacility 구/군 조회
    const careFacilityDistricts = await this.careFacilityRepository
      .createQueryBuilder('facility')
      .select('DISTINCT facility.district', 'district')
      .where('facility.isActive = :isActive', { isActive: true })
      .getRawMany<{ district: string }>();

    // CommunityChildCenter 구/군 조회
    const communityChildCenterDistricts = await this.communityChildCenterRepository
      .createQueryBuilder('center')
      .select('DISTINCT center.district', 'district')
      .where('center.isActive = :isActive', { isActive: true })
      .getRawMany<{ district: string }>();

    // EducationWelfareSchool 구/군 조회
    const educationWelfareSchoolDistricts = await this.educationWelfareSchoolRepository
      .createQueryBuilder('school')
      .select('DISTINCT school.district', 'district')
      .where('school.isActive = :isActive', { isActive: true })
      .getRawMany<{ district: string }>();

    // 중복 제거 및 정렬
    const allDistricts = new Set<string>();
    careFacilityDistricts.forEach((r) => allDistricts.add(r.district));
    communityChildCenterDistricts.forEach((r) => allDistricts.add(r.district));
    educationWelfareSchoolDistricts.forEach((r) => allDistricts.add(r.district));

    return Array.from(allDistricts).sort();
  }

  /**
   * 구/군별 시설 목록 조회
   */
  async getFacilitiesByDistrict(
    district: string,
    facilityType?: FacilityType,
  ): Promise<FacilityInfoDto[]> {
    // district가 없거나 빈 문자열이면 빈 배열 반환
    if (!district || district.trim() === '') {
      return [];
    }

    const trimmedDistrict = district.trim();
    const facilities: FacilityInfoDto[] = [];

    // 양육시설 조회
    if (!facilityType || facilityType === FacilityType.CARE_FACILITY) {
      const careFacilities = await this.careFacilityRepository.find({
        where: { district: trimmedDistrict, isActive: true },
        order: { name: 'ASC' },
      });

      facilities.push(
        ...careFacilities.map((f) => ({
          id: f.id,
          name: f.name,
          facilityType: FacilityType.CARE_FACILITY,
          district: f.district,
          address: f.address,
        })),
      );
    }

    // 지역아동센터 조회
    if (!facilityType || facilityType === FacilityType.COMMUNITY_CENTER) {
      const communityChildCenters = await this.communityChildCenterRepository.find({
        where: { district: trimmedDistrict, isActive: true },
        order: { name: 'ASC' },
      });

      facilities.push(
        ...communityChildCenters.map((c) => ({
          id: c.id,
          name: c.name,
          facilityType: FacilityType.COMMUNITY_CENTER,
          district: c.district,
          address: c.address,
        })),
      );
    }

    // 교육복지사협회 학교 조회
    if (!facilityType || facilityType === FacilityType.EDUCATION_WELFARE_SCHOOL) {
      const educationWelfareSchools = await this.educationWelfareSchoolRepository.find({
        where: { district: trimmedDistrict, isActive: true },
        order: { name: 'ASC' },
      });

      facilities.push(
        ...educationWelfareSchools.map((s) => ({
          id: s.id,
          name: s.name,
          facilityType: FacilityType.EDUCATION_WELFARE_SCHOOL,
          district: s.district,
          address: s.address,
        })),
      );
    }

    // 이름순 정렬
    return facilities.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }

  /**
   * 시설 로그인
   */
  async login(dto: InstitutionLoginDto): Promise<InstitutionAuthResponseDto> {
    let facility:
      | CareFacilityEntity
      | CommunityChildCenterEntity
      | EducationWelfareSchoolEntity
      | null = null;

    // 시설 타입에 따라 조회
    if (dto.facilityType === FacilityType.CARE_FACILITY) {
      facility = await this.careFacilityRepository.findOne({
        where: { id: dto.facilityId, isActive: true },
      });
    } else if (dto.facilityType === FacilityType.COMMUNITY_CENTER) {
      facility = await this.communityChildCenterRepository.findOne({
        where: { id: dto.facilityId, isActive: true },
      });
    } else if (dto.facilityType === FacilityType.EDUCATION_WELFARE_SCHOOL) {
      facility = await this.educationWelfareSchoolRepository.findOne({
        where: { id: dto.facilityId, isActive: true },
      });
    }

    if (!facility) {
      throw new UnauthorizedException('시설을 찾을 수 없습니다');
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(dto.password, facility.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다');
    }

    // JWT 토큰 생성
    const { accessToken, refreshToken } = await this.generateTokens(
      facility.id,
      dto.facilityType,
      facility.name,
      facility.district,
      facility.isPasswordChanged,
    );

    return {
      accessToken,
      refreshToken,
      institution: {
        id: facility.id,
        name: facility.name,
        facilityType: dto.facilityType,
        district: facility.district,
        isPasswordChanged: facility.isPasswordChanged,
      },
    };
  }

  /**
   * 시설 비밀번호 변경
   */
  async changePassword(dto: ChangeInstitutionPasswordDto): Promise<InstitutionAuthResponseDto> {
    let facility:
      | CareFacilityEntity
      | CommunityChildCenterEntity
      | EducationWelfareSchoolEntity
      | null = null;
    let repository: Repository<
      CareFacilityEntity | CommunityChildCenterEntity | EducationWelfareSchoolEntity
    >;

    // 시설 타입에 따라 조회
    if (dto.facilityType === FacilityType.CARE_FACILITY) {
      facility = await this.careFacilityRepository.findOne({
        where: { id: dto.facilityId, isActive: true },
      });
      repository = this.careFacilityRepository as Repository<
        CareFacilityEntity | CommunityChildCenterEntity | EducationWelfareSchoolEntity
      >;
    } else if (dto.facilityType === FacilityType.COMMUNITY_CENTER) {
      facility = await this.communityChildCenterRepository.findOne({
        where: { id: dto.facilityId, isActive: true },
      });
      repository = this.communityChildCenterRepository as Repository<
        CareFacilityEntity | CommunityChildCenterEntity | EducationWelfareSchoolEntity
      >;
    } else if (dto.facilityType === FacilityType.EDUCATION_WELFARE_SCHOOL) {
      facility = await this.educationWelfareSchoolRepository.findOne({
        where: { id: dto.facilityId, isActive: true },
      });
      repository = this.educationWelfareSchoolRepository as Repository<
        CareFacilityEntity | CommunityChildCenterEntity | EducationWelfareSchoolEntity
      >;
    } else {
      throw new UnauthorizedException('유효하지 않은 시설 타입입니다');
    }

    if (!facility) {
      throw new UnauthorizedException('시설을 찾을 수 없습니다');
    }

    // 현재 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(dto.currentPassword, facility.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다');
    }

    // 새 비밀번호 해시
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // 비밀번호 업데이트
    facility.password = hashedPassword;
    facility.isPasswordChanged = true;
    await repository.save(facility);

    // 새 토큰 발급
    const { accessToken, refreshToken } = await this.generateTokens(
      facility.id,
      dto.facilityType,
      facility.name,
      facility.district,
      true,
    );

    return {
      accessToken,
      refreshToken,
      institution: {
        id: facility.id,
        name: facility.name,
        facilityType: dto.facilityType,
        district: facility.district,
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

      // 시설 정보 확인
      let facility:
        | CareFacilityEntity
        | CommunityChildCenterEntity
        | EducationWelfareSchoolEntity
        | null = null;

      if (payload.facilityType === FacilityType.CARE_FACILITY) {
        facility = await this.careFacilityRepository.findOne({
          where: { id: payload.sub, isActive: true },
        });
      } else if (payload.facilityType === FacilityType.COMMUNITY_CENTER) {
        facility = await this.communityChildCenterRepository.findOne({
          where: { id: payload.sub, isActive: true },
        });
      } else if (payload.facilityType === FacilityType.EDUCATION_WELFARE_SCHOOL) {
        facility = await this.educationWelfareSchoolRepository.findOne({
          where: { id: payload.sub, isActive: true },
        });
      }

      if (!facility) {
        throw new UnauthorizedException('시설을 찾을 수 없습니다');
      }

      // 새 액세스 토큰 생성
      const accessToken = this.jwtService.sign(
        {
          sub: facility.id,
          facilityType: payload.facilityType,
          facilityName: facility.name,
          district: facility.district,
          role: 'INSTITUTION',
          isPasswordChanged: facility.isPasswordChanged,
        },
        {
          secret: this.configService.get('JWT_SECRET', 'your-secret-key-change-this'),
          expiresIn: '15m',
        },
      );

      return { accessToken };
    } catch {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다');
    }
  }

  /**
   * JWT 토큰 생성
   */
  private async generateTokens(
    facilityId: string,
    facilityType: FacilityType,
    facilityName: string,
    district: string,
    isPasswordChanged: boolean,
  ) {
    const payload = {
      sub: facilityId,
      facilityType,
      facilityName,
      district,
      role: 'INSTITUTION',
      isPasswordChanged,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET', 'your-secret-key-change-this'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET', 'your-refresh-secret-change-this'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}
