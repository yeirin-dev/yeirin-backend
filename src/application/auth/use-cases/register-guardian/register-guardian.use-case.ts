import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CareFacilityRepository } from '@domain/care-facility/repository/care-facility.repository';
import { DomainError, Result } from '@domain/common/result';
import { CommunityChildCenterRepository } from '@domain/community-child-center/repository/community-child-center.repository';
import { GuardianProfileRepository } from '@domain/guardian/repository/guardian-profile.repository';
import { User } from '@domain/user/model/user';
import { Email } from '@domain/user/model/value-objects/email.vo';
import { Password } from '@domain/user/model/value-objects/password.vo';
import { PhoneNumber } from '@domain/user/model/value-objects/phone-number.vo';
import { RealName } from '@domain/user/model/value-objects/real-name.vo';
import { UserRole } from '@domain/user/model/value-objects/user-role.vo';
import { UserRepository } from '@domain/user/repository/user.repository';
import { GuardianType } from '@infrastructure/persistence/typeorm/entity/enums/guardian-type.enum';
import { GuardianProfileEntity } from '@infrastructure/persistence/typeorm/entity/guardian-profile.entity';

/**
 * 보호자 회원가입 Command (Input DTO)
 */
export interface RegisterGuardianCommand {
  // User 정보
  email: string;
  password: string;
  realName: string;
  phoneNumber: string;

  // GuardianProfile 정보
  guardianType: GuardianType;
  careFacilityId?: string;
  communityChildCenterId?: string;
  numberOfChildren?: number;
  address?: string;
  addressDetail?: string;
  postalCode?: string;
  notes?: string;
}

/**
 * 보호자 회원가입 결과
 */
export interface RegisterGuardianResult {
  user: User;
  guardianProfile: GuardianProfileEntity;
}

/**
 * 보호자 회원가입 Use Case
 * - User + GuardianProfile 트랜잭션 생성
 * - 선생님인 경우 기관 존재 여부 확인
 */
@Injectable()
export class RegisterGuardianUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('GuardianProfileRepository')
    private readonly guardianProfileRepository: GuardianProfileRepository,
    @Inject('CareFacilityRepository')
    private readonly careFacilityRepository: CareFacilityRepository,
    @Inject('CommunityChildCenterRepository')
    private readonly communityChildCenterRepository: CommunityChildCenterRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    command: RegisterGuardianCommand,
  ): Promise<Result<RegisterGuardianResult, DomainError>> {
    // 1. Value Objects 생성 및 검증
    const emailResult = Email.create(command.email);
    if (emailResult.isFailure) {
      return Result.fail(emailResult.getError());
    }
    const email = emailResult.getValue();

    // 2. 이메일 중복 확인
    const emailExists = await this.userRepository.existsByEmail(email);
    if (emailExists) {
      return Result.fail(new DomainError('이미 사용 중인 이메일입니다'));
    }

    // 3. 기관 존재 여부 확인 (선생님인 경우)
    const institutionValidation = await this.validateInstitution(command);
    if (institutionValidation.isFailure) {
      return Result.fail(institutionValidation.getError());
    }

    // 4. 비밀번호 생성 및 해시화
    const passwordResult = Password.create(command.password, {
      checkStrength: true,
    });
    if (passwordResult.isFailure) {
      return Result.fail(passwordResult.getError());
    }
    const hashedPassword = await passwordResult.getValue().hash();

    // 5. 나머지 Value Objects 생성
    const realNameResult = RealName.create(command.realName);
    if (realNameResult.isFailure) {
      return Result.fail(realNameResult.getError());
    }

    const phoneNumberResult = PhoneNumber.create(command.phoneNumber);
    if (phoneNumberResult.isFailure) {
      return Result.fail(phoneNumberResult.getError());
    }

    const roleResult = UserRole.create('GUARDIAN');
    if (roleResult.isFailure) {
      return Result.fail(roleResult.getError());
    }

    // 6. User Aggregate 생성
    const userResult = User.create({
      email,
      password: hashedPassword,
      realName: realNameResult.getValue(),
      phoneNumber: phoneNumberResult.getValue(),
      role: roleResult.getValue(),
    });

    if (userResult.isFailure) {
      return Result.fail(userResult.getError());
    }

    const user = userResult.getValue();

    // 7. 트랜잭션으로 User + GuardianProfile 동시 생성
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // User 저장
      const savedUser = await this.userRepository.save(user);

      // GuardianProfile 저장
      const guardianProfile = await this.guardianProfileRepository.create({
        userId: savedUser.id,
        guardianType: command.guardianType,
        careFacilityId: command.careFacilityId || null,
        communityChildCenterId: command.communityChildCenterId || null,
        numberOfChildren: command.numberOfChildren || null,
        address: command.address || null,
        addressDetail: command.addressDetail || null,
        postalCode: command.postalCode || null,
        notes: command.notes || null,
      });

      await queryRunner.commitTransaction();

      return Result.ok({
        user: savedUser,
        guardianProfile,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return Result.fail(
        new DomainError(`보호자 회원가입에 실패했습니다: ${(error as Error).message}`),
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 기관 존재 여부 검증 (선생님 타입인 경우)
   */
  private async validateInstitution(
    command: RegisterGuardianCommand,
  ): Promise<Result<void, DomainError>> {
    // 양육시설 선생님인 경우
    if (command.guardianType === GuardianType.CARE_FACILITY_TEACHER) {
      if (!command.careFacilityId) {
        return Result.fail(new DomainError('양육시설 선생님은 양육시설 ID가 필수입니다'));
      }

      const facilityExists = await this.careFacilityRepository.exists(command.careFacilityId);
      if (!facilityExists) {
        return Result.fail(new DomainError('존재하지 않는 양육시설입니다'));
      }
    }

    // 지역아동센터 선생님인 경우
    if (command.guardianType === GuardianType.COMMUNITY_CENTER_TEACHER) {
      if (!command.communityChildCenterId) {
        return Result.fail(new DomainError('지역아동센터 선생님은 지역아동센터 ID가 필수입니다'));
      }

      const centerExists = await this.communityChildCenterRepository.exists(
        command.communityChildCenterId,
      );
      if (!centerExists) {
        return Result.fail(new DomainError('존재하지 않는 지역아동센터입니다'));
      }
    }

    return Result.ok(undefined);
  }
}
