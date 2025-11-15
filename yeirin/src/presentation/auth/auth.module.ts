import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '@infrastructure/persistence/typeorm/entity/user.entity';
import { GuardianProfileEntity } from '@infrastructure/persistence/typeorm/entity/guardian-profile.entity';
import { VoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/voucher-institution.entity';
import { CounselorProfileEntity } from '@infrastructure/persistence/typeorm/entity/counselor-profile.entity';
import { UserRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/user.repository.impl';
import { TypeOrmGuardianProfileRepository } from '@infrastructure/persistence/typeorm/repository/typeorm-guardian-profile.repository';
import { InstitutionRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/institution.repository.impl';
import { CounselorProfileRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/counselor-profile.repository.impl';
import { JwtStrategy } from '@infrastructure/auth/strategies/jwt.strategy';
import { AuthService } from '@application/auth/auth.service';
import { RegisterUserUseCase } from '@application/auth/use-cases/register-user/register-user.use-case';
import { RegisterGuardianUseCase } from '@application/auth/use-cases/register-guardian/register-guardian.use-case';
import { RegisterInstitutionUseCase } from '@application/auth/use-cases/register-institution/register-institution.use-case';
import { RegisterCounselorUseCase } from '@application/auth/use-cases/register-counselor/register-counselor.use-case';
import { AuthController } from './auth.controller';

/**
 * Auth Module
 * - 인증/인가 관련 모듈
 * - DDD 계층 통합 (Domain, Application, Infrastructure, Presentation)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      GuardianProfileEntity,
      VoucherInstitutionEntity,
      CounselorProfileEntity,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'your-secret-key-change-this'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Application Service
    AuthService,

    // Use Cases
    RegisterUserUseCase,
    RegisterGuardianUseCase,
    RegisterInstitutionUseCase,
    RegisterCounselorUseCase,

    // Infrastructure - Repositories
    JwtStrategy,
    {
      provide: 'IUserRepository',
      useClass: UserRepositoryImpl,
    },
    {
      provide: 'GuardianProfileRepository',
      useClass: TypeOrmGuardianProfileRepository,
    },
    {
      provide: 'InstitutionRepository',
      useClass: InstitutionRepositoryImpl,
    },
    {
      provide: 'CounselorProfileRepository',
      useClass: CounselorProfileRepositoryImpl,
    },
  ],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
