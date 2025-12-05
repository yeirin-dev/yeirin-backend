import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuditLogEntity } from '../persistence/typeorm/entity/audit-log.entity';
import { CareFacilityEntity } from '../persistence/typeorm/entity/care-facility.entity';
import { ChildProfileEntity } from '../persistence/typeorm/entity/child-profile.entity';
import { CommunityChildCenterEntity } from '../persistence/typeorm/entity/community-child-center.entity';
import { CounselReportEntity } from '../persistence/typeorm/entity/counsel-report.entity';
import { CounselRequestRecommendationEntity } from '../persistence/typeorm/entity/counsel-request-recommendation.entity';
import { CounselRequestEntity } from '../persistence/typeorm/entity/counsel-request.entity';
import { CounselorProfileEntity } from '../persistence/typeorm/entity/counselor-profile.entity';
import { GuardianProfileEntity } from '../persistence/typeorm/entity/guardian-profile.entity';
import { PsychologicalStatusLogEntity } from '../persistence/typeorm/entity/psychological-status-log.entity';
import { ReviewEntity } from '../persistence/typeorm/entity/review.entity';
import { UserEntity } from '../persistence/typeorm/entity/user.entity';
import { VoucherInstitutionEntity } from '../persistence/typeorm/entity/voucher-institution.entity';

export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const isDevelopment = configService.get<string>('NODE_ENV') !== 'production';
  const isLocalDb = configService.get<string>('DB_HOST')?.includes('localhost') ||
                    configService.get<string>('DB_HOST')?.includes('127.0.0.1');

  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_DATABASE'),
    // RDS 연결 시 SSL 필수 (로컬 DB는 SSL 불필요)
    ssl: isLocalDb ? false : { rejectUnauthorized: false },
    entities: [
      // Core User & Profile
      UserEntity,
      GuardianProfileEntity,
      VoucherInstitutionEntity,
      CounselorProfileEntity,
      // Child & Care
      ChildProfileEntity,
      CareFacilityEntity,
      CommunityChildCenterEntity,
      // Counseling
      CounselRequestEntity,
      CounselRequestRecommendationEntity,
      CounselReportEntity,
      // Feedback
      ReviewEntity,
      // Audit & Logging
      PsychologicalStatusLogEntity,
      AuditLogEntity,
    ],
    synchronize: isDevelopment,
    logging: isDevelopment,
    // Connection pool configuration
    extra: {
      max: isDevelopment ? 10 : 50, // 최대 연결 수
      min: isDevelopment ? 2 : 10, // 최소 연결 수
      idleTimeoutMillis: 30000, // 유휴 연결 타임아웃
      connectionTimeoutMillis: 5000, // 연결 타임아웃
    },
  };
};
