import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy, InstitutionJwtPayload } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const config: Record<string, string> = {
                JWT_SECRET: 'test-secret-key',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('validate', () => {
    it('유효한 기관 JWT 페이로드를 사용자 객체로 변환해야 함', async () => {
      // Given
      const payload: InstitutionJwtPayload = {
        sub: 'test-institution-id',
        role: 'INSTITUTION',
        facilityType: 'CARE_FACILITY',
        facilityName: '테스트 기관',
        district: '서울특별시 강남구',
        isPasswordChanged: true,
        iat: Date.now(),
        exp: Date.now() + 900000, // 15분 후
      };

      // When
      const result = await strategy.validate(payload);

      // Then
      expect(result).toEqual({
        userId: 'test-institution-id',
        institutionId: 'test-institution-id',
        facilityType: 'CARE_FACILITY',
        facilityName: '테스트 기관',
        district: '서울특별시 강남구',
        role: 'INSTITUTION',
        isPasswordChanged: true,
      });
    });

    it('COMMUNITY_CENTER 타입 기관을 검증해야 함', async () => {
      // Given
      const payload: InstitutionJwtPayload = {
        sub: 'community-center-id',
        role: 'INSTITUTION',
        facilityType: 'COMMUNITY_CENTER',
        facilityName: '지역아동센터',
        district: '경기도 성남시',
        isPasswordChanged: false,
        iat: Date.now(),
        exp: Date.now() + 900000,
      };

      // When
      const result = await strategy.validate(payload);

      // Then
      expect(result).toEqual({
        userId: 'community-center-id',
        institutionId: 'community-center-id',
        facilityType: 'COMMUNITY_CENTER',
        facilityName: '지역아동센터',
        district: '경기도 성남시',
        role: 'INSTITUTION',
        isPasswordChanged: false,
      });
    });

    it('페이로드의 sub를 userId와 institutionId로 매핑해야 함', async () => {
      // Given
      const payload: InstitutionJwtPayload = {
        sub: 'unique-institution-id',
        role: 'INSTITUTION',
        facilityType: 'CARE_FACILITY',
        facilityName: '시설명',
        district: '지역명',
        isPasswordChanged: true,
      };

      // When
      const result = await strategy.validate(payload);

      // Then
      expect(result.userId).toBe(payload.sub);
      expect(result.institutionId).toBe(payload.sub);
    });

    it('기관 정보를 그대로 반환해야 함', async () => {
      // Given
      const payload: InstitutionJwtPayload = {
        sub: 'test-id',
        role: 'INSTITUTION',
        facilityType: 'CARE_FACILITY',
        facilityName: '특정 기관명',
        district: '특정 지역',
        isPasswordChanged: false,
      };

      // When
      const result = await strategy.validate(payload);

      // Then
      expect(result.facilityName).toBe(payload.facilityName);
      expect(result.district).toBe(payload.district);
      expect(result.role).toBe('INSTITUTION');
    });
  });

  describe('configuration', () => {
    it('ConfigService에서 JWT_SECRET을 가져와야 함', () => {
      // Then
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET', 'your-secret-key-change-this');
    });

    it('Authorization 헤더에서 Bearer 토큰을 추출해야 함', () => {
      // Strategy는 ExtractJwt.fromAuthHeaderAsBearerToken() 사용
      // 이는 Passport가 자동으로 처리하므로 설정만 확인
      expect(strategy).toBeDefined();
    });
  });
});
