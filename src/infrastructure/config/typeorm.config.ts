import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../persistence/typeorm/entity/user.entity';
import { GuardianProfileEntity } from '../persistence/typeorm/entity/guardian-profile.entity';
import { VoucherInstitutionEntity } from '../persistence/typeorm/entity/voucher-institution.entity';
import { CounselorProfileEntity } from '../persistence/typeorm/entity/counselor-profile.entity';
import { ReviewEntity } from '../persistence/typeorm/entity/review.entity';

export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const isDevelopment = configService.get<string>('NODE_ENV') !== 'production';

  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_DATABASE'),
    entities: [
      UserEntity,
      GuardianProfileEntity,
      VoucherInstitutionEntity,
      CounselorProfileEntity,
      ReviewEntity,
    ],
    synchronize: isDevelopment,
    logging: isDevelopment,
  };
};
