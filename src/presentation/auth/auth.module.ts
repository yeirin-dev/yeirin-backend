import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstitutionAuthService } from '@application/auth/institution-auth.service';
import { BImpactInstitutionAuthService } from '@application/auth/b-impact-institution-auth.service';
import { JwtStrategy } from '@infrastructure/auth/strategies/jwt.strategy';
import { CareFacilityEntity } from '@infrastructure/persistence/typeorm/entity/care-facility.entity';
import { CommunityChildCenterEntity } from '@infrastructure/persistence/typeorm/entity/community-child-center.entity';
import { EducationWelfareSchoolEntity } from '@infrastructure/persistence/typeorm/entity/education-welfare-school.entity';
import { BImpactVoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/b-impact-voucher-institution.entity';
import { CareFacilityRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/care-facility.repository.impl';
import { CommunityChildCenterRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/community-child-center.repository.impl';
import { AuthController } from './auth.controller';
import { BImpactAuthController } from './b-impact-auth.controller';

/**
 * Auth Module
 * - 기관 기반 인증/인가 모듈
 * - 아동양육시설(CareFacility), 지역아동센터(CommunityChildCenter),
 *   교육복지사협회 학교(EducationWelfareSchool), B-IMPACT 기관 인증 지원
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CareFacilityEntity,
      CommunityChildCenterEntity,
      EducationWelfareSchoolEntity,
      BImpactVoucherInstitutionEntity,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'your-secret-key-change-this'),
        signOptions: { expiresIn: configService.get('JWT_ACCESS_EXPIRATION', '24h') },
      }),
    }),
  ],
  controllers: [AuthController, BImpactAuthController],
  providers: [
    // Application Services
    InstitutionAuthService,
    BImpactInstitutionAuthService,

    // Infrastructure - Strategies & Repositories
    JwtStrategy,
    {
      provide: 'CareFacilityRepository',
      useClass: CareFacilityRepositoryImpl,
    },
    {
      provide: 'CommunityChildCenterRepository',
      useClass: CommunityChildCenterRepositoryImpl,
    },
  ],
  exports: [InstitutionAuthService, BImpactInstitutionAuthService, JwtStrategy],
})
export class AuthModule {}
