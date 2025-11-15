import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DomainError, Result } from '@domain/common/result';
import { CounselorProfileRepository } from '@domain/counselor/repository/counselor-profile.repository';
import { User } from '@domain/user/model/user';
import { Email } from '@domain/user/model/value-objects/email.vo';
import { Password } from '@domain/user/model/value-objects/password.vo';
import { PhoneNumber } from '@domain/user/model/value-objects/phone-number.vo';
import { RealName } from '@domain/user/model/value-objects/real-name.vo';
import { UserRole } from '@domain/user/model/value-objects/user-role.vo';
import { UserRepository } from '@domain/user/repository/user.repository';
import { CounselorProfileEntity } from '@infrastructure/persistence/typeorm/entity/counselor-profile.entity';

/**
 * 상담사 회원가입 Command (Input DTO)
 */
export interface RegisterCounselorCommand {
  // User 정보
  email: string;
  password: string;
  realName: string;
  phoneNumber: string;

  // CounselorProfile 정보
  institutionId: string;
  name: string;
  experienceYears: number;
  certifications: string[];
  specialties?: string[];
  introduction?: string;
}

/**
 * 상담사 회원가입 결과
 */
export interface RegisterCounselorResult {
  user: User;
  counselorProfile: CounselorProfileEntity;
}

/**
 * 상담사 회원가입 Use Case
 * - User + CounselorProfile 트랜잭션 생성
 */
@Injectable()
export class RegisterCounselorUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('CounselorProfileRepository')
    private readonly counselorProfileRepository: CounselorProfileRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    command: RegisterCounselorCommand,
  ): Promise<Result<RegisterCounselorResult, DomainError>> {
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

    // 3. 비밀번호 생성 및 해시화
    const passwordResult = Password.create(command.password, { checkStrength: true });
    if (passwordResult.isFailure) {
      return Result.fail(passwordResult.getError());
    }
    const hashedPassword = await passwordResult.getValue().hash();

    // 4. 나머지 Value Objects 생성
    const realNameResult = RealName.create(command.realName);
    if (realNameResult.isFailure) {
      return Result.fail(realNameResult.getError());
    }

    const phoneNumberResult = PhoneNumber.create(command.phoneNumber);
    if (phoneNumberResult.isFailure) {
      return Result.fail(phoneNumberResult.getError());
    }

    const roleResult = UserRole.create('COUNSELOR');
    if (roleResult.isFailure) {
      return Result.fail(roleResult.getError());
    }

    // 5. User Aggregate 생성
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

    // 6. 트랜잭션으로 User + CounselorProfile 동시 생성
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // User 저장
      const savedUser = await this.userRepository.save(user);

      // CounselorProfile 저장
      const counselorProfile = await this.counselorProfileRepository.create({
        userId: savedUser.id,
        institutionId: command.institutionId,
        name: command.name,
        experienceYears: command.experienceYears,
        certifications: command.certifications,
        specialties: command.specialties || [],
        introduction: command.introduction || '',
      });

      await queryRunner.commitTransaction();

      return Result.ok({
        user: savedUser,
        counselorProfile,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return Result.fail(
        new DomainError(`상담사 회원가입에 실패했습니다: ${(error as Error).message}`),
      );
    } finally {
      await queryRunner.release();
    }
  }
}
