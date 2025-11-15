import { validate } from 'class-validator';
import { RegisterInstitutionDto } from './register-institution.dto';
import { VoucherType } from '@infrastructure/persistence/typeorm/entity/enums/voucher-type.enum';
import { ServiceType } from '@infrastructure/persistence/typeorm/entity/enums/service-type.enum';
import { SpecialTreatment } from '@infrastructure/persistence/typeorm/entity/enums/special-treatment.enum';

describe('RegisterInstitutionDto 유효성 검증', () => {
  let dto: RegisterInstitutionDto;

  beforeEach(() => {
    // 기본 유효한 DTO 생성
    dto = new RegisterInstitutionDto();
    dto.email = 'institution@example.com';
    dto.password = 'Test1234!@#';
    dto.realName = '김철수';
    dto.phoneNumber = '010-1234-5678';
    dto.centerName = '서울아동심리상담센터';
    dto.representativeName = '김철수';
    dto.address = '서울특별시 강남구 테헤란로 123';
    dto.establishedDate = '2020-01-15';
    dto.operatingVouchers = [VoucherType.CHILD_PSYCHOLOGY, VoucherType.LANGUAGE_DEVELOPMENT];
    dto.isQualityCertified = false;
    dto.maxCapacity = 30;
    dto.introduction = 'ADHD 및 정서문제 전문 상담센터';
    dto.primaryTargetGroup = 'ADHD';
    dto.canProvideComprehensiveTest = true;
    dto.providedServices = [ServiceType.COUNSELING, ServiceType.PLAY_THERAPY, ServiceType.ART_THERAPY];
    dto.specialTreatments = [SpecialTreatment.LANGUAGE, SpecialTreatment.DEVELOPMENTAL_REHABILITATION];
    dto.canProvideParentCounseling = true;
  });

  describe('운영 바우처 검증', () => {
    it('유효한 바우처 타입을 허용한다', async () => {
      dto.operatingVouchers = [
        VoucherType.CHILD_PSYCHOLOGY,
        VoucherType.LANGUAGE_DEVELOPMENT,
        VoucherType.DEVELOPMENTAL_REHABILITATION,
      ];

      const errors = await validate(dto);
      const voucherErrors = errors.find((e) => e.property === 'operatingVouchers');

      expect(voucherErrors).toBeUndefined();
    });

    it('잘못된 바우처 타입을 거부한다', async () => {
      // @ts-expect-error - 의도적으로 잘못된 값 전달
      dto.operatingVouchers = ['CHILD_VOUCHER', 'YOUTH_VOUCHER'];

      const errors = await validate(dto);
      const voucherErrors = errors.find((e) => e.property === 'operatingVouchers');

      expect(voucherErrors).toBeDefined();
      expect(voucherErrors?.constraints).toHaveProperty('isEnum');
      expect(voucherErrors?.constraints?.isEnum).toContain('유효하지 않은 바우처 타입입니다');
    });

    it('빈 배열을 허용한다', async () => {
      dto.operatingVouchers = [];

      const errors = await validate(dto);
      const voucherErrors = errors.find((e) => e.property === 'operatingVouchers');

      expect(voucherErrors).toBeUndefined();
    });

    it('배열이 아닌 값을 거부한다', async () => {
      // @ts-expect-error - 의도적으로 잘못된 타입 전달
      dto.operatingVouchers = 'NOT_AN_ARRAY';

      const errors = await validate(dto);
      const voucherErrors = errors.find((e) => e.property === 'operatingVouchers');

      expect(voucherErrors).toBeDefined();
      expect(voucherErrors?.constraints).toHaveProperty('isArray');
    });
  });

  describe('제공 서비스 검증', () => {
    it('유효한 서비스 타입을 허용한다', async () => {
      dto.providedServices = [
        ServiceType.COUNSELING,
        ServiceType.PLAY_THERAPY,
        ServiceType.ART_THERAPY,
        ServiceType.MUSIC_THERAPY,
      ];

      const errors = await validate(dto);
      const serviceErrors = errors.find((e) => e.property === 'providedServices');

      expect(serviceErrors).toBeUndefined();
    });

    it('잘못된 서비스 타입을 거부한다', async () => {
      // @ts-expect-error - 의도적으로 잘못된 값 전달
      dto.providedServices = ['INVALID_SERVICE', 'UNKNOWN_THERAPY'];

      const errors = await validate(dto);
      const serviceErrors = errors.find((e) => e.property === 'providedServices');

      expect(serviceErrors).toBeDefined();
      expect(serviceErrors?.constraints).toHaveProperty('isEnum');
      expect(serviceErrors?.constraints?.isEnum).toContain('유효하지 않은 서비스 타입입니다');
    });

    it('빈 배열을 허용한다', async () => {
      dto.providedServices = [];

      const errors = await validate(dto);
      const serviceErrors = errors.find((e) => e.property === 'providedServices');

      expect(serviceErrors).toBeUndefined();
    });
  });

  describe('특수 치료 검증', () => {
    it('유효한 특수 치료 타입을 허용한다', async () => {
      dto.specialTreatments = [
        SpecialTreatment.LANGUAGE,
        SpecialTreatment.DEVELOPMENTAL_REHABILITATION,
      ];

      const errors = await validate(dto);
      const treatmentErrors = errors.find((e) => e.property === 'specialTreatments');

      expect(treatmentErrors).toBeUndefined();
    });

    it('잘못된 특수 치료 타입을 거부한다', async () => {
      // @ts-expect-error - 의도적으로 잘못된 값 전달
      dto.specialTreatments = ['INVALID_TREATMENT', 'UNKNOWN_SPECIAL'];

      const errors = await validate(dto);
      const treatmentErrors = errors.find((e) => e.property === 'specialTreatments');

      expect(treatmentErrors).toBeDefined();
      expect(treatmentErrors?.constraints).toHaveProperty('isEnum');
      expect(treatmentErrors?.constraints?.isEnum).toContain('유효하지 않은 특수치료 타입입니다');
    });

    it('NONE 값을 허용한다', async () => {
      dto.specialTreatments = [SpecialTreatment.NONE];

      const errors = await validate(dto);
      const treatmentErrors = errors.find((e) => e.property === 'specialTreatments');

      expect(treatmentErrors).toBeUndefined();
    });

    it('빈 배열을 허용한다', async () => {
      dto.specialTreatments = [];

      const errors = await validate(dto);
      const treatmentErrors = errors.find((e) => e.property === 'specialTreatments');

      expect(treatmentErrors).toBeUndefined();
    });
  });

  describe('기본 정보 검증', () => {
    it('유효한 이메일 형식을 허용한다', async () => {
      dto.email = 'test@example.com';

      const errors = await validate(dto);
      const emailErrors = errors.find((e) => e.property === 'email');

      expect(emailErrors).toBeUndefined();
    });

    it('잘못된 이메일 형식을 거부한다', async () => {
      dto.email = 'invalid-email';

      const errors = await validate(dto);
      const emailErrors = errors.find((e) => e.property === 'email');

      expect(emailErrors).toBeDefined();
      expect(emailErrors?.constraints).toHaveProperty('isEmail');
    });

    it('비밀번호는 최소 8자 이상이어야 한다', async () => {
      dto.password = 'Short1!';

      const errors = await validate(dto);
      const passwordErrors = errors.find((e) => e.property === 'password');

      expect(passwordErrors).toBeDefined();
      expect(passwordErrors?.constraints).toHaveProperty('minLength');
    });

    it('비밀번호는 영문+숫자+특수문자를 포함해야 한다', async () => {
      dto.password = 'onlyletters';

      const errors = await validate(dto);
      const passwordErrors = errors.find((e) => e.property === 'password');

      expect(passwordErrors).toBeDefined();
      expect(passwordErrors?.constraints).toHaveProperty('matches');
    });

    it('전화번호 형식을 검증한다', async () => {
      dto.phoneNumber = '123-456';

      const errors = await validate(dto);
      const phoneErrors = errors.find((e) => e.property === 'phoneNumber');

      expect(phoneErrors).toBeDefined();
      expect(phoneErrors?.constraints).toHaveProperty('matches');
    });

    it('센터명은 최소 2자 이상이어야 한다', async () => {
      dto.centerName = '가';

      const errors = await validate(dto);
      const centerErrors = errors.find((e) => e.property === 'centerName');

      expect(centerErrors).toBeDefined();
      expect(centerErrors?.constraints).toHaveProperty('minLength');
    });

    it('최대 수용 인원은 1 이상이어야 한다', async () => {
      dto.maxCapacity = 0;

      const errors = await validate(dto);
      const capacityErrors = errors.find((e) => e.property === 'maxCapacity');

      expect(capacityErrors).toBeDefined();
      expect(capacityErrors?.constraints).toHaveProperty('min');
    });
  });

  describe('선택적 필드 검증', () => {
    it('secondaryTargetGroup이 없어도 유효하다', async () => {
      dto.secondaryTargetGroup = undefined;

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('secondaryTargetGroup이 있으면 최대 50자까지 허용한다', async () => {
      dto.secondaryTargetGroup = 'a'.repeat(51);

      const errors = await validate(dto);
      const targetErrors = errors.find((e) => e.property === 'secondaryTargetGroup');

      expect(targetErrors).toBeDefined();
      expect(targetErrors?.constraints).toHaveProperty('maxLength');
    });
  });

  describe('전체 통합 검증', () => {
    it('모든 필드가 유효하면 검증을 통과한다', async () => {
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('여러 필드가 잘못되면 모든 에러를 반환한다', async () => {
      dto.email = 'invalid';
      dto.password = 'short';
      // @ts-expect-error - 의도적으로 잘못된 값 전달
      dto.operatingVouchers = ['WRONG_VOUCHER'];

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
      expect(errors.some((e) => e.property === 'operatingVouchers')).toBe(true);
    });
  });
});
