import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Result } from '@domain/common/result';
import { User } from '@domain/user/model/user';
import { Email } from '@domain/user/model/value-objects/email.vo';
import { Password } from '@domain/user/model/value-objects/password.vo';
import { PhoneNumber } from '@domain/user/model/value-objects/phone-number.vo';
import { RealName } from '@domain/user/model/value-objects/real-name.vo';
import { UserRole } from '@domain/user/model/value-objects/user-role.vo';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterCounselorUseCase } from './use-cases/register-counselor/register-counselor.use-case';
import { RegisterGuardianUseCase } from './use-cases/register-guardian/register-guardian.use-case';
import { RegisterInstitutionUseCase } from './use-cases/register-institution/register-institution.use-case';
import { RegisterUserUseCase } from './use-cases/register-user/register-user.use-case';

describe('AuthService', () => {
  let service: AuthService;
  let registerUserUseCase: RegisterUserUseCase;
  let jwtService: JwtService;
  let userRepository: any;

  const createMockUser = (): User => {
    return {
      id: 'test-user-id',
      email: { value: 'test@example.com' } as Email,
      password: { value: '$2b$10$hashed_password', isHashed: true } as Password,
      realName: { value: '테스트사용자' } as RealName,
      phoneNumber: { value: '010-1234-5678' } as PhoneNumber,
      role: { value: 'GUARDIAN' } as UserRole,
      refreshToken: null,
      isEmailVerified: false,
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      updateRefreshToken: jest.fn(),
      verifyEmail: jest.fn(),
      deactivate: jest.fn(),
      activate: jest.fn(),
    } as unknown as User;
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          JWT_SECRET: 'test-secret',
          JWT_ACCESS_EXPIRATION: '15m',
          JWT_REFRESH_EXPIRATION: '7d',
        };
        return config[key];
      }),
    };

    const mockRegisterUserUseCase = {
      execute: jest.fn(),
    };

    const mockRegisterGuardianUseCase = {
      execute: jest.fn(),
    };

    const mockRegisterInstitutionUseCase = {
      execute: jest.fn(),
    };

    const mockRegisterCounselorUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'UserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: RegisterUserUseCase,
          useValue: mockRegisterUserUseCase,
        },
        {
          provide: RegisterGuardianUseCase,
          useValue: mockRegisterGuardianUseCase,
        },
        {
          provide: RegisterInstitutionUseCase,
          useValue: mockRegisterInstitutionUseCase,
        },
        {
          provide: RegisterCounselorUseCase,
          useValue: mockRegisterCounselorUseCase,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    registerUserUseCase = module.get<RegisterUserUseCase>(RegisterUserUseCase);
    jwtService = module.get<JwtService>(JwtService);
    userRepository = module.get('UserRepository');

    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'Test1234!@',
      realName: '테스트',
      phoneNumber: '010-1234-5678',
      role: 'GUARDIAN',
    };

    it('성공적으로 회원가입하고 토큰을 반환한다', async () => {
      // Given
      const mockUser = createMockUser();
      jest.spyOn(registerUserUseCase, 'execute').mockResolvedValue(Result.ok(mockUser));
      jest
        .spyOn(jwtService, 'sign')
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);

      // When
      const result = await service.register(registerDto);

      // Then
      expect(registerUserUseCase.execute).toHaveBeenCalledWith({
        email: registerDto.email,
        password: registerDto.password,
        realName: registerDto.realName,
        phoneNumber: registerDto.phoneNumber,
        role: registerDto.role,
      });
      expect(result).toEqual({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        user: {
          id: mockUser.id,
          email: mockUser.email.value,
          realName: mockUser.realName.value,
          role: mockUser.role.value,
        },
      });
    });

    it('UseCase 실패 시 ConflictException을 던진다', async () => {
      // Given
      const error = new Error('이미 존재하는 이메일입니다');
      jest.spyOn(registerUserUseCase, 'execute').mockResolvedValue(Result.fail(error));

      // When & Then
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });
});
