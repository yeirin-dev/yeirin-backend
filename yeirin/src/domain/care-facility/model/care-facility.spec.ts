import { Address } from '@domain/common/value-objects/address.vo';
import { InstitutionName } from '@domain/common/value-objects/institution-name.vo';
import { CareFacility, CreateCareFacilityProps } from './care-facility';

describe('CareFacility Aggregate Root', () => {
  const createValidProps = (): CreateCareFacilityProps => ({
    name: InstitutionName.create('해피양육시설').getValue(),
    address: Address.create({
      address: '서울시 강남구 테헤란로 123',
      addressDetail: '3층',
      postalCode: '06234',
    }).getValue(),
    representativeName: '홍길동',
    phoneNumber: '02-1234-5678',
    capacity: 50,
    establishedDate: new Date('2020-01-01'),
    introduction: '아이들의 행복한 성장을 돕는 양육시설입니다',
  });

  describe('생성', () => {
    it('유효한 Props로 CareFacility를 생성한다', () => {
      // Given
      const props = createValidProps();

      // When
      const result = CareFacility.create(props);

      // Then
      expect(result.isSuccess).toBe(true);
      const facility = result.getValue();
      expect(facility.id).toBeDefined();
      expect(facility.name.value).toBe('해피양육시설');
      expect(facility.representativeName).toBe('홍길동');
      expect(facility.phoneNumber).toBe('02-1234-5678');
      expect(facility.capacity).toBe(50);
      expect(facility.isActive).toBe(true);
    });

    it('소개글 없이도 생성 가능하다', () => {
      // Given
      const props = createValidProps();
      delete props.introduction;

      // When
      const result = CareFacility.create(props);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().introduction).toBeNull();
    });

    it('대표자명이 없으면 실패한다', () => {
      // Given
      const props = createValidProps();
      props.representativeName = '';

      // When
      const result = CareFacility.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('대표자명');
    });

    it('대표자명이 50자 초과면 실패한다', () => {
      // Given
      const props = createValidProps();
      props.representativeName = '가'.repeat(51);

      // When
      const result = CareFacility.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('50자');
    });

    it('연락처가 없으면 실패한다', () => {
      // Given
      const props = createValidProps();
      props.phoneNumber = '';

      // When
      const result = CareFacility.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('연락처');
    });

    it('연락처 형식이 잘못되면 실패한다', () => {
      // Given
      const props = createValidProps();
      props.phoneNumber = 'invalid';

      // When
      const result = CareFacility.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('연락처 형식');
    });

    it('정원이 1 미만이면 실패한다', () => {
      // Given
      const props = createValidProps();
      props.capacity = 0;

      // When
      const result = CareFacility.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('1명 이상');
    });

    it('정원이 500 초과면 실패한다', () => {
      // Given
      const props = createValidProps();
      props.capacity = 501;

      // When
      const result = CareFacility.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('500명');
    });

    it('설립일이 미래면 실패한다', () => {
      // Given
      const props = createValidProps();
      props.establishedDate = new Date('2099-01-01');

      // When
      const result = CareFacility.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('미래');
    });

    it('소개글이 500자 초과면 실패한다', () => {
      // Given
      const props = createValidProps();
      props.introduction = '가'.repeat(501);

      // When
      const result = CareFacility.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('500자');
    });
  });

  describe('restore', () => {
    it('DB에서 복원한다', () => {
      // Given
      const props = {
        id: 'test-id',
        name: InstitutionName.restore('해피양육시설'),
        address: Address.restore('서울시 강남구', '3층', '06234'),
        representativeName: '홍길동',
        phoneNumber: '02-1234-5678',
        capacity: 50,
        establishedDate: new Date('2020-01-01'),
        introduction: '소개글',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // When
      const facility = CareFacility.restore(props);

      // Then
      expect(facility.id).toBe('test-id');
      expect(facility.name.value).toBe('해피양육시설');
      expect(facility.isActive).toBe(true);
    });
  });

  describe('비즈니스 메서드', () => {
    let facility: CareFacility;

    beforeEach(() => {
      facility = CareFacility.create(createValidProps()).getValue();
    });

    describe('changeName', () => {
      it('기관명을 변경한다', () => {
        // Given
        const newName = InstitutionName.create('새로운양육시설').getValue();

        // When
        facility.changeName(newName);

        // Then
        expect(facility.name.value).toBe('새로운양육시설');
      });
    });

    describe('changeAddress', () => {
      it('주소를 변경한다', () => {
        // Given
        const newAddress = Address.create({
          address: '부산시 해운대구',
        }).getValue();

        // When
        facility.changeAddress(newAddress);

        // Then
        expect(facility.address.address).toBe('부산시 해운대구');
      });
    });

    describe('changeRepresentative', () => {
      it('대표자 정보를 변경한다', () => {
        // When
        const result = facility.changeRepresentative('김철수', '031-5678-1234');

        // Then
        expect(result.isSuccess).toBe(true);
        expect(facility.representativeName).toBe('김철수');
        expect(facility.phoneNumber).toBe('031-5678-1234');
      });

      it('빈 이름이면 실패한다', () => {
        // When
        const result = facility.changeRepresentative('', '031-5678-1234');

        // Then
        expect(result.isFailure).toBe(true);
      });

      it('잘못된 연락처면 실패한다', () => {
        // When
        const result = facility.changeRepresentative('김철수', 'invalid');

        // Then
        expect(result.isFailure).toBe(true);
      });
    });

    describe('changeCapacity', () => {
      it('정원을 변경한다', () => {
        // When
        const result = facility.changeCapacity(100);

        // Then
        expect(result.isSuccess).toBe(true);
        expect(facility.capacity).toBe(100);
      });

      it('정원이 1 미만이면 실패한다', () => {
        // When
        const result = facility.changeCapacity(0);

        // Then
        expect(result.isFailure).toBe(true);
        expect(result.getError().message).toContain('1명 이상');
      });

      it('정원이 500 초과면 실패한다', () => {
        // When
        const result = facility.changeCapacity(501);

        // Then
        expect(result.isFailure).toBe(true);
        expect(result.getError().message).toContain('500명');
      });
    });

    describe('changeIntroduction', () => {
      it('소개글을 변경한다', () => {
        // When
        const result = facility.changeIntroduction('새로운 소개글');

        // Then
        expect(result.isSuccess).toBe(true);
        expect(facility.introduction).toBe('새로운 소개글');
      });

      it('500자 초과면 실패한다', () => {
        // When
        const result = facility.changeIntroduction('가'.repeat(501));

        // Then
        expect(result.isFailure).toBe(true);
      });

      it('null로 설정 가능하다', () => {
        // When
        const result = facility.changeIntroduction(null);

        // Then
        expect(result.isSuccess).toBe(true);
        expect(facility.introduction).toBeNull();
      });
    });

    describe('activate / deactivate', () => {
      it('기관을 비활성화한다', () => {
        // When
        facility.deactivate();

        // Then
        expect(facility.isActive).toBe(false);
      });

      it('기관을 활성화한다', () => {
        // Given
        facility.deactivate();

        // When
        facility.activate();

        // Then
        expect(facility.isActive).toBe(true);
      });
    });
  });
});
