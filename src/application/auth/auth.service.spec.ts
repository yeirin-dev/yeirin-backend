import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserRepository } from '@domain/auth/repository/user.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserEntity } from '@infrastructure/persistence/typeorm/entity/user.entity';

// Bcrypt mocking
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let jwtService: jest.Mocked<JwtService>;

  // Test data factory
  const createMockUser = (overrides?: Partial<UserEntity>): UserEntity => ({
    id: 'test-user-id',
    email: 'test@example.com',
    password: 'hashed_password',
    realName: '테스트사용자',
    phoneNumber: '010-1234-5678',
    role: 'GUARDIAN',
    refreshToken: null,
    isEmailVerified: false,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });

  beforeEach(async () => {
    // Mock repository
    const mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateRefreshToken: jest.fn(),
      updateLastLogin: jest.fn(),
    };

    // Mock JWT service
    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    // Mock ConfigService
    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        const config: Record<string, string> = {
          JWT_SECRET: 'test-secret-key',
          JWT_ACCESS_EXPIRATION: '15m',
          JWT_REFRESH_EXPIRATION: '7d',
        };
        return config[key] || defaultValue;
      }),
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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get('UserRepository');
    jwtService = module.get(JwtService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      password: 'Test1234!@',
      realName: '새사용자',
      phoneNumber: '010-9999-8888',
      role: 'GUARDIAN',
    };

    it('새로운 사용자를 성공적으로 등록해야 함', async () => {
      // Given
      userRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_password'); // password
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_refresh_token'); // refresh token

      const newUser = createMockUser({
        email: registerDto.email,
        realName: registerDto.realName,
        phoneNumber: registerDto.phoneNumber,
        role: registerDto.role,
      });
      userRepository.create.mockResolvedValue(newUser);
      userRepository.updateRefreshToken.mockResolvedValue(undefined);

      jwtService.sign.mockReturnValueOnce('access_token');
      jwtService.sign.mockReturnValueOnce('refresh_token');

      // When
      const result = await service.register(registerDto);

      // Then
      expect(userRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerDto.email,
          realName: registerDto.realName,
          phoneNumber: registerDto.phoneNumber,
          role: registerDto.role,
          password: 'hashed_password',
        }),
      );
      expect(userRepository.updateRefreshToken).toHaveBeenCalledWith(newUser.id, 'hashed_refresh_token');
      expect(result).toEqual({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        user: expect.objectContaining({
          id: newUser.id,
          email: newUser.email,
          realName: newUser.realName,
          role: newUser.role,
        }),
      });
    });

    it('이미 존재하는 이메일이면 ConflictException을 던져야 함', async () => {
      // Given
      const existingUser = createMockUser({ email: registerDto.email });
      userRepository.findByEmail.mockResolvedValue(existingUser);

      // When & Then
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('비밀번호를 bcrypt로 해시화해야 함', async () => {
      // Given
      userRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      userRepository.create.mockResolvedValue(createMockUser());
      jwtService.sign.mockReturnValue('token');

      // When
      await service.register(registerDto);

      // Then
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
    });

    it('리프레시 토큰을 해시화하여 저장해야 함', async () => {
      // Given
      userRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_password');
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_refresh_token');

      const newUser = createMockUser();
      userRepository.create.mockResolvedValue(newUser);
      userRepository.updateRefreshToken.mockResolvedValue(undefined);
      jwtService.sign.mockReturnValueOnce('access_token');
      jwtService.sign.mockReturnValueOnce('refresh_token');

      // When
      await service.register(registerDto);

      // Then
      expect(bcrypt.hash).toHaveBeenNthCalledWith(2, 'refresh_token', 10);
      expect(userRepository.updateRefreshToken).toHaveBeenCalledWith(newUser.id, 'hashed_refresh_token');
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Test1234!@',
    };

    it('유효한 자격증명으로 로그인해야 함', async () => {
      // Given
      const user = createMockUser();
      userRepository.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_refresh_token');
      jwtService.sign.mockReturnValueOnce('access_token');
      jwtService.sign.mockReturnValueOnce('refresh_token');
      userRepository.updateRefreshToken.mockResolvedValue(undefined);
      userRepository.updateLastLogin.mockResolvedValue(undefined);

      // When
      const result = await service.login(loginDto);

      // Then
      expect(userRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, user.password);
      expect(userRepository.updateRefreshToken).toHaveBeenCalledWith(user.id, 'hashed_refresh_token');
      expect(userRepository.updateLastLogin).toHaveBeenCalledWith(user.id);
      expect(result).toEqual({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        user: expect.objectContaining({
          id: user.id,
          email: user.email,
        }),
      });
    });

    it('존재하지 않는 이메일이면 UnauthorizedException을 던져야 함', async () => {
      // Given
      userRepository.findByEmail.mockResolvedValue(null);

      // When & Then
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('잘못된 비밀번호면 UnauthorizedException을 던져야 함', async () => {
      // Given
      const user = createMockUser();
      userRepository.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // When & Then
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('비활성화된 계정이면 UnauthorizedException을 던져야 함', async () => {
      // Given
      const inactiveUser = createMockUser({ isActive: false });
      userRepository.findByEmail.mockResolvedValue(inactiveUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // When & Then
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('로그인 시 lastLoginAt을 업데이트해야 함', async () => {
      // Given
      const user = createMockUser();
      userRepository.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_refresh_token');
      jwtService.sign.mockReturnValue('token');
      userRepository.updateRefreshToken.mockResolvedValue(undefined);
      userRepository.updateLastLogin.mockResolvedValue(undefined);

      // When
      await service.login(loginDto);

      // Then
      expect(userRepository.updateLastLogin).toHaveBeenCalledWith(user.id);
    });
  });

  describe('refresh', () => {
    const refreshToken = 'valid_refresh_token';

    it('유효한 리프레시 토큰으로 새 액세스 토큰을 발급해야 함', async () => {
      // Given
      const payload = { sub: 'test-user-id', email: 'test@example.com', role: 'GUARDIAN' };
      jwtService.verify.mockReturnValue(payload);

      const user = createMockUser({ refreshToken: 'hashed_refresh_token' });
      userRepository.findById.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('new_access_token');

      // When
      const result = await service.refresh(refreshToken);

      // Then
      expect(jwtService.verify).toHaveBeenCalledWith(
        refreshToken,
        expect.objectContaining({ secret: expect.any(String) }),
      );
      expect(userRepository.findById).toHaveBeenCalledWith(payload.sub);
      expect(bcrypt.compare).toHaveBeenCalledWith(refreshToken, user.refreshToken);
      expect(result).toEqual({ accessToken: 'new_access_token' });
    });

    it('만료된 리프레시 토큰이면 UnauthorizedException을 던져야 함', async () => {
      // Given
      jwtService.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      // When & Then
      await expect(service.refresh(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('저장된 토큰과 일치하지 않으면 UnauthorizedException을 던져야 함', async () => {
      // Given
      const payload = { sub: 'test-user-id', email: 'test@example.com', role: 'GUARDIAN' };
      jwtService.verify.mockReturnValue(payload);

      const user = createMockUser({ refreshToken: 'different_hashed_token' });
      userRepository.findById.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // When & Then
      await expect(service.refresh(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('사용자가 존재하지 않으면 UnauthorizedException을 던져야 함', async () => {
      // Given
      const payload = { sub: 'non-existent-id', email: 'test@example.com', role: 'GUARDIAN' };
      jwtService.verify.mockReturnValue(payload);
      userRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(service.refresh(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('리프레시 토큰을 삭제해야 함', async () => {
      // Given
      const userId = 'test-user-id';
      userRepository.updateRefreshToken.mockResolvedValue(undefined);

      // When
      await service.logout(userId);

      // Then
      expect(userRepository.updateRefreshToken).toHaveBeenCalledWith(userId, null);
    });

    it('로그아웃은 항상 성공해야 함 (멱등성)', async () => {
      // Given
      const userId = 'test-user-id';
      userRepository.updateRefreshToken.mockResolvedValue(undefined);

      // When
      await service.logout(userId);
      await service.logout(userId); // 두 번 호출

      // Then
      expect(userRepository.updateRefreshToken).toHaveBeenCalledTimes(2);
    });
  });

  describe('JWT 토큰 생성', () => {
    it('액세스 토큰은 15분 만료 시간을 가져야 함', async () => {
      // Given
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'Test1234!@',
        realName: '테스트',
        phoneNumber: '010-5555-6666',
        role: 'GUARDIAN',
      };
      userRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      userRepository.create.mockResolvedValue(createMockUser());
      userRepository.updateRefreshToken.mockResolvedValue(undefined);
      jwtService.sign.mockReturnValue('token');

      // When
      await service.register(registerDto);

      // Then
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ expiresIn: '15m' }),
      );
    });

    it('리프레시 토큰은 7일 만료 시간을 가져야 함', async () => {
      // Given
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'Test1234!@',
        realName: '테스트',
        phoneNumber: '010-5555-6666',
        role: 'GUARDIAN',
      };
      userRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      userRepository.create.mockResolvedValue(createMockUser());
      userRepository.updateRefreshToken.mockResolvedValue(undefined);
      jwtService.sign.mockReturnValue('token');

      // When
      await service.register(registerDto);

      // Then
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        2,
        expect.any(Object),
        expect.objectContaining({ expiresIn: '7d' }),
      );
    });
  });
});
