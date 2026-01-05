import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DomainError, Result } from '@domain/common/result';
import { InstitutionRepository } from '@domain/institution/repository/institution.repository';
import { User } from '@domain/user/model/user';
import { Email } from '@domain/user/model/value-objects/email.vo';
import { Password } from '@domain/user/model/value-objects/password.vo';
import { PhoneNumber } from '@domain/user/model/value-objects/phone-number.vo';
import { RealName } from '@domain/user/model/value-objects/real-name.vo';
import { UserRole } from '@domain/user/model/value-objects/user-role.vo';
import { UserRepository } from '@domain/user/repository/user.repository';
import { VoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/voucher-institution.entity';

/**
 * 기관 대표 회원가입 Command (Input DTO)
 */
export interface RegisterInstitutionCommand {
  // User 정보
  email: string;
  password: string;
  realName: string;
  phoneNumber: string;

  // VoucherInstitution 정보
  centerName: string;
  representativeName: string;
  address: string;
  establishedDate: string;
  operatingVouchers: string[];
  isQualityCertified: boolean;
  maxCapacity: number;
  introduction: string;
  primaryTargetGroup: string;
  secondaryTargetGroup?: string;
  canProvideComprehensiveTest: boolean;
  providedServices: string[];
  specialTreatments: string[];
  canProvideParentCounseling: boolean;
}

/**
 * 기관 대표 회원가입 결과
 */
export interface RegisterInstitutionResult {
  user: User;
  institution: VoucherInstitutionEntity;
}

/**
 * 기관 대표 회원가입 Use Case
 * - User + VoucherInstitution 트랜잭션 생성
 */
@Injectable()
export class RegisterInstitutionUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('InstitutionRepository')
    private readonly institutionRepository: InstitutionRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    command: RegisterInstitutionCommand,
  ): Promise<Result<RegisterInstitutionResult, DomainError>> {
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

    const roleResult = UserRole.create('INSTITUTION_ADMIN');
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

    // 6. 트랜잭션으로 User + VoucherInstitution 동시 생성
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // User 저장
      const savedUser = await this.userRepository.save(user);

      // VoucherInstitution 저장
      const institution = await this.institutionRepository.create({
        userId: savedUser.id,
        centerName: command.centerName,
        representativeName: command.representativeName,
        address: command.address,
        establishedDate: new Date(command.establishedDate),
        operatingVouchers: command.operatingVouchers as any,
        isQualityCertified: command.isQualityCertified,
        maxCapacity: command.maxCapacity,
        introduction: command.introduction,
        counselorCount: 0, // 초기값
        counselorCertifications: [], // 초기값
        primaryTargetGroup: command.primaryTargetGroup,
        secondaryTargetGroup: command.secondaryTargetGroup || '',
        canProvideComprehensiveTest: command.canProvideComprehensiveTest,
        providedServices: command.providedServices as any,
        specialTreatments: command.specialTreatments as any,
        canProvideParentCounseling: command.canProvideParentCounseling,
        averageRating: 0, // 초기값
        reviewCount: 0, // 초기값
      });

      await queryRunner.commitTransaction();

      return Result.ok({
        user: savedUser,
        institution,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return Result.fail(
        new DomainError(`기관 회원가입에 실패했습니다: ${(error as Error).message}`),
      );
    } finally {
      await queryRunner.release();
    }
  }
}
