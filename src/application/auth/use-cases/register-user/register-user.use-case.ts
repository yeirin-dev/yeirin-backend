import { Inject, Injectable } from '@nestjs/common';
import { DomainError, Result } from '@domain/common/result';
import { User } from '@domain/user/model/user';
import { Email } from '@domain/user/model/value-objects/email.vo';
import { Password } from '@domain/user/model/value-objects/password.vo';
import { PhoneNumber } from '@domain/user/model/value-objects/phone-number.vo';
import { RealName } from '@domain/user/model/value-objects/real-name.vo';
import { UserRole, UserRoleType } from '@domain/user/model/value-objects/user-role.vo';
import { UserRepository } from '@domain/user/repository/user.repository';

/**
 * 회원가입 Command (Input DTO)
 */
export interface RegisterUserCommand {
  email: string;
  password: string;
  realName: string;
  phoneNumber: string;
  role: UserRoleType;
}

/**
 * 회원가입 Use Case
 * - Application Layer: 비즈니스 흐름 조율
 * - Domain Layer 사용 (직접 비즈니스 로직 없음)
 * - CQRS 패턴: Command (쓰기 작업)
 */
@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * 회원가입 실행
   */
  async execute(command: RegisterUserCommand): Promise<Result<User, DomainError>> {
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

    const roleResult = UserRole.create(command.role);
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

    // 6. Repository 저장
    const user = userResult.getValue();
    const savedUser = await this.userRepository.save(user);

    // 7. Domain Events 발행 (이벤트 핸들러에서 처리)
    // - UserRegistered 이벤트 → 이메일 인증 메일 발송
    // - 환영 메시지 발송 등

    return Result.ok(savedUser);
  }
}
