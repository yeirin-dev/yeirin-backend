import { Injectable, Inject, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IUserRepository } from '@domain/user/repository/user.repository';
import { Email } from '@domain/user/model/value-objects/email.vo';
import { Password } from '@domain/user/model/value-objects/password.vo';
import { RegisterDto } from './dto/register.dto';
import { RegisterGuardianDto } from './dto/register-guardian.dto';
import { RegisterInstitutionDto } from './dto/register-institution.dto';
import { RegisterCounselorDto } from './dto/register-counselor.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RegisterUserUseCase } from './use-cases/register-user/register-user.use-case';
import { RegisterGuardianUseCase } from './use-cases/register-guardian/register-guardian.use-case';
import { RegisterInstitutionUseCase } from './use-cases/register-institution/register-institution.use-case';
import { RegisterCounselorUseCase } from './use-cases/register-counselor/register-counselor.use-case';

/**
 * Auth Service (Application Layer)
 * - Use Cases 조율
 * - JWT 토큰 관리
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly registerGuardianUseCase: RegisterGuardianUseCase,
    private readonly registerInstitutionUseCase: RegisterInstitutionUseCase,
    private readonly registerCounselorUseCase: RegisterCounselorUseCase,
  ) {}

  /**
   * 회원가입 (Use Case 사용)
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Use Case 실행
    const result = await this.registerUserUseCase.execute({
      email: dto.email,
      password: dto.password,
      realName: dto.realName,
      phoneNumber: dto.phoneNumber,
      role: dto.role,
    });

    if (result.isFailure) {
      throw new ConflictException(result.getError().message);
    }

    const user = result.getValue();

    // JWT 토큰 생성
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email.value,
      user.role.value,
    );

    // Refresh Token 저장
    user.updateRefreshToken(refreshToken);
    await this.userRepository.save(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email.value,
        realName: user.realName.value,
        role: user.role.value,
      },
    };
  }

  /**
   * 보호자 회원가입
   */
  async registerGuardian(dto: RegisterGuardianDto): Promise<AuthResponseDto> {
    const result = await this.registerGuardianUseCase.execute({
      email: dto.email,
      password: dto.password,
      realName: dto.realName,
      phoneNumber: dto.phoneNumber,
      organizationName: dto.organizationName,
      guardianType: dto.guardianType,
      numberOfChildren: dto.numberOfChildren,
      address: dto.address,
      addressDetail: dto.addressDetail,
      postalCode: dto.postalCode,
      notes: dto.notes,
    });

    if (result.isFailure) {
      throw new ConflictException(result.getError().message);
    }

    const { user } = result.getValue();

    // JWT 토큰 생성
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email.value,
      user.role.value,
    );

    // Refresh Token 저장
    user.updateRefreshToken(refreshToken);
    await this.userRepository.save(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email.value,
        realName: user.realName.value,
        role: user.role.value,
      },
    };
  }

  /**
   * 기관 대표 회원가입
   */
  async registerInstitution(dto: RegisterInstitutionDto): Promise<AuthResponseDto> {
    const result = await this.registerInstitutionUseCase.execute({
      email: dto.email,
      password: dto.password,
      realName: dto.realName,
      phoneNumber: dto.phoneNumber,
      centerName: dto.centerName,
      representativeName: dto.representativeName,
      address: dto.address,
      establishedDate: dto.establishedDate,
      operatingVouchers: dto.operatingVouchers,
      isQualityCertified: dto.isQualityCertified,
      maxCapacity: dto.maxCapacity,
      introduction: dto.introduction,
      primaryTargetGroup: dto.primaryTargetGroup,
      secondaryTargetGroup: dto.secondaryTargetGroup,
      canProvideComprehensiveTest: dto.canProvideComprehensiveTest,
      providedServices: dto.providedServices,
      specialTreatments: dto.specialTreatments,
      canProvideParentCounseling: dto.canProvideParentCounseling,
    });

    if (result.isFailure) {
      throw new ConflictException(result.getError().message);
    }

    const { user } = result.getValue();

    // JWT 토큰 생성
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email.value,
      user.role.value,
    );

    // Refresh Token 저장
    user.updateRefreshToken(refreshToken);
    await this.userRepository.save(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email.value,
        realName: user.realName.value,
        role: user.role.value,
      },
    };
  }

  /**
   * 상담사 회원가입
   */
  async registerCounselor(dto: RegisterCounselorDto): Promise<AuthResponseDto> {
    const result = await this.registerCounselorUseCase.execute({
      email: dto.email,
      password: dto.password,
      realName: dto.realName,
      phoneNumber: dto.phoneNumber,
      institutionId: dto.institutionId,
      name: dto.name,
      experienceYears: dto.experienceYears,
      certifications: dto.certifications,
      specialties: dto.specialties,
      introduction: dto.introduction,
    });

    if (result.isFailure) {
      throw new ConflictException(result.getError().message);
    }

    const { user } = result.getValue();

    // JWT 토큰 생성
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email.value,
      user.role.value,
    );

    // Refresh Token 저장
    user.updateRefreshToken(refreshToken);
    await this.userRepository.save(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email.value,
        realName: user.realName.value,
        role: user.role.value,
      },
    };
  }

  /**
   * 로그인
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // 이메일로 사용자 조회
    const emailResult = Email.create(dto.email);
    if (emailResult.isFailure) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    const user = await this.userRepository.findByEmail(emailResult.getValue());
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    // 비밀번호 확인
    const isPasswordValid = await user.password.compare(dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    // 계정 활성화 확인
    if (!user.isActive) {
      throw new UnauthorizedException('비활성화된 계정입니다');
    }

    // 로그인 기록
    const loginResult = user.recordLogin();
    if (loginResult.isFailure) {
      throw new UnauthorizedException(loginResult.getError().message);
    }

    // 토큰 생성
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email.value,
      user.role.value,
    );

    // Refresh Token 저장
    user.updateRefreshToken(refreshToken);
    await this.userRepository.save(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email.value,
        realName: user.realName.value,
        role: user.role.value,
      },
    };
  }

  /**
   * 리프레시 토큰으로 새 액세스 토큰 발급
   */
  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // 리프레시 토큰 검증
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET', 'your-refresh-secret-change-this'),
      });

      // 사용자 확인
      const user = await this.userRepository.findById(payload.sub);
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다');
      }

      // 새 액세스 토큰 생성
      const accessToken = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email.value,
          role: user.role.value,
        },
        {
          secret: this.configService.get('JWT_SECRET', 'your-secret-key-change-this'),
          expiresIn: '15m',
        },
      );

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다');
    }
  }

  /**
   * 로그아웃
   */
  async logout(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (user) {
      user.updateRefreshToken(null);
      await this.userRepository.save(user);
    }
  }

  /**
   * 토큰 생성 (액세스 + 리프레시)
   */
  private async generateTokens(userId: string, email: string, role: string) {
    const payload = {
      sub: userId,
      email,
      role,
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
