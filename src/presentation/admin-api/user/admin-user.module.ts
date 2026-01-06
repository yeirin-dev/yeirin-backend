import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivateUserAdminUseCase } from '@application/user/admin/activate-user.admin.usecase';
import { BanUserAdminUseCase } from '@application/user/admin/ban-user.admin.usecase';
import { DeactivateUserAdminUseCase } from '@application/user/admin/deactivate-user.admin.usecase';
import { GetUserDetailAdminUseCase } from '@application/user/admin/get-user-detail.admin.usecase';
import { GetUsersAdminUseCase } from '@application/user/admin/get-users.admin.usecase';
import { UnbanUserAdminUseCase } from '@application/user/admin/unban-user.admin.usecase';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { CounselorProfileEntity } from '@infrastructure/persistence/typeorm/entity/counselor-profile.entity';
import { UserEntity } from '@infrastructure/persistence/typeorm/entity/user.entity';
import { UserRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/user.repository.impl';
import { AdminUserController } from './admin-user.controller';

// Admin Use Cases

/**
 * Admin User Module
 * 사용자 관리 Admin API
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      CounselorProfileEntity,
      CounselRequestEntity,
    ]),
  ],
  controllers: [AdminUserController],
  providers: [
    // Repository
    {
      provide: 'UserRepository',
      useClass: UserRepositoryImpl,
    },
    // Use Cases
    GetUsersAdminUseCase,
    GetUserDetailAdminUseCase,
    BanUserAdminUseCase,
    UnbanUserAdminUseCase,
    ActivateUserAdminUseCase,
    DeactivateUserAdminUseCase,
  ],
})
export class AdminUserModule {}
