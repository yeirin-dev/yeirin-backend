import { User } from '@domain/user/model/user';
import { UserRepository } from '@domain/user/repository/user.repository';
import { RegisterUserCommand, RegisterUserUseCase } from './register-user.use-case';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      existsByEmail: jest.fn(),
    };

    useCase = new RegisterUserUseCase(mockUserRepository);
  });

  const createValidCommand = (): RegisterUserCommand => ({
    email: 'user@example.com',
    password: 'Test1234!@#',
    realName: '홍길동',
    phoneNumber: '010-1234-5678',
    role: 'INSTITUTION_ADMIN',
  });

  describe('성공 케이스', () => {
    it('유효한 정보로 회원가입을 성공한다', async () => {
      // Given
      const command = createValidCommand();
      mockUserRepository.existsByEmail.mockResolvedValue(false);
      mockUserRepository.save.mockImplementation(async (user) => user);

      // When
      const result = await useCase.execute(command);

      // Then
      expect(result.isSuccess).toBe(true);
      const user = result.getValue();
      expect(user.email.value).toBe('user@example.com');
      expect(user.realName.value).toBe('홍길동');
      expect(user.role.value).toBe('INSTITUTION_ADMIN');
    });

    it('비밀번호는 해시화되어 저장된다', async () => {
      // Given
      const command = createValidCommand();
      mockUserRepository.existsByEmail.mockResolvedValue(false);
      mockUserRepository.save.mockImplementation(async (user) => user);

      // When
      const result = await useCase.execute(command);

      // Then
      const user = result.getValue();
      expect(user.password.isHashed).toBe(true);
      expect(user.password.value).not.toBe(command.password);
    });

    it('Repository save()가 호출된다', async () => {
      // Given
      const command = createValidCommand();
      mockUserRepository.existsByEmail.mockResolvedValue(false);
      mockUserRepository.save.mockImplementation(async (user) => user);

      // When
      await useCase.execute(command);

      // Then
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.save).toHaveBeenCalledWith(expect.any(User));
    });
  });

  describe('실패 케이스', () => {
    it('이메일이 중복되면 실패한다', async () => {
      // Given
      const command = createValidCommand();
      mockUserRepository.existsByEmail.mockResolvedValue(true);

      // When
      const result = await useCase.execute(command);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('이미 사용 중인 이메일');
    });

    it('유효하지 않은 이메일이면 실패한다', async () => {
      // Given
      const command = createValidCommand();
      command.email = 'invalid-email';

      // When
      const result = await useCase.execute(command);

      // Then
      expect(result.isFailure).toBe(true);
    });

    it('약한 비밀번호면 실패한다', async () => {
      // Given
      const command = createValidCommand();
      command.password = '123456'; // 약한 비밀번호

      // When
      const result = await useCase.execute(command);

      // Then
      expect(result.isFailure).toBe(true);
    });

    it('유효하지 않은 역할이면 실패한다', async () => {
      // Given
      const command = createValidCommand();
      command.role = 'INVALID_ROLE' as any;

      // When
      const result = await useCase.execute(command);

      // Then
      expect(result.isFailure).toBe(true);
    });
  });
});
