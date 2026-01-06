import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from '@application/auth/auth.service';
import { InstitutionAuthService } from '@application/auth/institution-auth.service';
import { RegisterCounselorUseCase } from '@application/auth/use-cases/register-counselor/register-counselor.use-case';
import { RegisterInstitutionUseCase } from '@application/auth/use-cases/register-institution/register-institution.use-case';
import { RegisterUserUseCase } from '@application/auth/use-cases/register-user/register-user.use-case';
import { JwtStrategy } from '@infrastructure/auth/strategies/jwt.strategy';
import { CareFacilityEntity } from '@infrastructure/persistence/typeorm/entity/care-facility.entity';
import { CommunityChildCenterEntity } from '@infrastructure/persistence/typeorm/entity/community-child-center.entity';
import { CounselorProfileEntity } from '@infrastructure/persistence/typeorm/entity/counselor-profile.entity';
import { UserEntity } from '@infrastructure/persistence/typeorm/entity/user.entity';
import { VoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/voucher-institution.entity';
import { CareFacilityRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/care-facility.repository.impl';
import { CommunityChildCenterRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/community-child-center.repository.impl';
import { CounselorProfileRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/counselor-profile.repository.impl';
import { InstitutionRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/institution.repository.impl';
import { UserRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/user.repository.impl';
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
      VoucherInstitutionEntity,
      CounselorProfileEntity,
      CareFacilityEntity,
      CommunityChildCenterEntity,
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
    // Application Services
    AuthService,
    InstitutionAuthService,

    // Use Cases
    RegisterUserUseCase,
    RegisterInstitutionUseCase,
    RegisterCounselorUseCase,

    // Infrastructure - Repositories
    JwtStrategy,
    {
      provide: 'UserRepository',
      useClass: UserRepositoryImpl,
    },
    {
      provide: 'InstitutionRepository',
      useClass: InstitutionRepositoryImpl,
    },
    {
      provide: 'CounselorProfileRepository',
      useClass: CounselorProfileRepositoryImpl,
    },
    {
      provide: 'CareFacilityRepository',
      useClass: CareFacilityRepositoryImpl,
    },
    {
      provide: 'CommunityChildCenterRepository',
      useClass: CommunityChildCenterRepositoryImpl,
    },
  ],
  exports: [AuthService, InstitutionAuthService, JwtStrategy],
})
export class AuthModule {}
