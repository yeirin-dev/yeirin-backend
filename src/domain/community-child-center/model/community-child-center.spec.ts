import { Address } from '@domain/common/value-objects/address.vo';
import { InstitutionName } from '@domain/common/value-objects/institution-name.vo';
import { CommunityChildCenter, CreateCommunityChildCenterProps } from './community-child-center';

describe('CommunityChildCenter Aggregate Root', () => {
  const createValidProps = (): CreateCommunityChildCenterProps => ({
    name: InstitutionName.create('행복지역아동센터').getValue(),
    address: Address.create({
      address: '서울시 마포구 상암로 123',
      addressDetail: '2층',
      postalCode: '03925',
    }).getValue(),
    directorName: '김영희',
    phoneNumber: '02-9876-5432',
    capacity: 30,
    establishedDate: new Date('2018-03-15'),
    introduction: '지역 아동들의 방과후 돌봄을 제공합니다',
    operatingHours: '평일 14:00-19:00',
  });

  describe('생성', () => {
    it('유효한 Props로 CommunityChildCenter를 생성한다', () => {
      // Given
      const props = createValidProps();

      // When
      const result = CommunityChildCenter.create(props);

      // Then
      expect(result.isSuccess).toBe(true);
      const center = result.getValue();
      expect(center.id).toBeDefined();
      expect(center.name.value).toBe('행복지역아동센터');
      expect(center.directorName).toBe('김영희');
      expect(center.phoneNumber).toBe('02-9876-5432');
      expect(center.capacity).toBe(30);
      expect(center.operatingHours).toBe('평일 14:00-19:00');
      expect(center.isActive).toBe(true);
    });

    it('소개글과 운영시간 없이도 생성 가능하다', () => {
      // Given
      const props = createValidProps();
      delete props.introduction;
      delete props.operatingHours;

      // When
      const result = CommunityChildCenter.create(props);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().introduction).toBeNull();
      expect(result.getValue().operatingHours).toBeNull();
    });

    it('대표자명이 없으면 실패한다', () => {
      // Given
      const props = createValidProps();
      props.directorName = '';

      // When
      const result = CommunityChildCenter.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('대표자명');
    });

    it('대표자명이 50자 초과면 실패한다', () => {
      // Given
      const props = createValidProps();
      props.directorName = '가'.repeat(51);

      // When
      const result = CommunityChildCenter.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('50자');
    });

    it('연락처가 없으면 실패한다', () => {
      // Given
      const props = createValidProps();
      props.phoneNumber = '';

      // When
      const result = CommunityChildCenter.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('연락처');
    });

    it('연락처 형식이 잘못되면 실패한다', () => {
      // Given
      const props = createValidProps();
      props.phoneNumber = 'invalid';

      // When
      const result = CommunityChildCenter.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('연락처 형식');
    });

    it('정원이 1 미만이면 실패한다', () => {
      // Given
      const props = createValidProps();
      props.capacity = 0;

      // When
      const result = CommunityChildCenter.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('1명 이상');
    });

    it('정원이 300 초과면 실패한다', () => {
      // Given
      const props = createValidProps();
      props.capacity = 301;

      // When
      const result = CommunityChildCenter.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('300명');
    });

    it('설립일이 미래면 실패한다', () => {
      // Given
      const props = createValidProps();
      props.establishedDate = new Date('2099-01-01');

      // When
      const result = CommunityChildCenter.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('미래');
    });

    it('소개글이 500자 초과면 실패한다', () => {
      // Given
      const props = createValidProps();
      props.introduction = '가'.repeat(501);

      // When
      const result = CommunityChildCenter.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('500자');
    });

    it('운영시간이 100자 초과면 실패한다', () => {
      // Given
      const props = createValidProps();
      props.operatingHours = '가'.repeat(101);

      // When
      const result = CommunityChildCenter.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('100자');
    });
  });

  describe('restore', () => {
    it('DB에서 복원한다', () => {
      // Given
      const props = {
        id: 'test-id',
        name: InstitutionName.restore('행복지역아동센터'),
        address: Address.restore('서울시 마포구', '2층', '03925'),
        directorName: '김영희',
        phoneNumber: '02-9876-5432',
        capacity: 30,
        establishedDate: new Date('2018-03-15'),
        introduction: '소개글',
        operatingHours: '평일 14:00-19:00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // When
      const center = CommunityChildCenter.restore(props);

      // Then
      expect(center.id).toBe('test-id');
      expect(center.name.value).toBe('행복지역아동센터');
      expect(center.operatingHours).toBe('평일 14:00-19:00');
      expect(center.isActive).toBe(true);
    });
  });

  describe('비즈니스 메서드', () => {
    let center: CommunityChildCenter;

    beforeEach(() => {
      center = CommunityChildCenter.create(createValidProps()).getValue();
    });

    describe('changeName', () => {
      it('기관명을 변경한다', () => {
        // Given
        const newName = InstitutionName.create('새로운지역아동센터').getValue();

        // When
        center.changeName(newName);

        // Then
        expect(center.name.value).toBe('새로운지역아동센터');
      });
    });

    describe('changeAddress', () => {
      it('주소를 변경한다', () => {
        // Given
        const newAddress = Address.create({
          address: '경기도 수원시',
        }).getValue();

        // When
        center.changeAddress(newAddress);

        // Then
        expect(center.address.address).toBe('경기도 수원시');
      });
    });

    describe('changeDirector', () => {
      it('대표자 정보를 변경한다', () => {
        // When
        const result = center.changeDirector('박철수', '031-1234-5678');

        // Then
        expect(result.isSuccess).toBe(true);
        expect(center.directorName).toBe('박철수');
        expect(center.phoneNumber).toBe('031-1234-5678');
      });

      it('빈 이름이면 실패한다', () => {
        // When
        const result = center.changeDirector('', '031-1234-5678');

        // Then
        expect(result.isFailure).toBe(true);
      });

      it('잘못된 연락처면 실패한다', () => {
        // When
        const result = center.changeDirector('박철수', 'invalid');

        // Then
        expect(result.isFailure).toBe(true);
      });
    });

    describe('changeCapacity', () => {
      it('정원을 변경한다', () => {
        // When
        const result = center.changeCapacity(50);

        // Then
        expect(result.isSuccess).toBe(true);
        expect(center.capacity).toBe(50);
      });

      it('정원이 1 미만이면 실패한다', () => {
        // When
        const result = center.changeCapacity(0);

        // Then
        expect(result.isFailure).toBe(true);
        expect(result.getError().message).toContain('1명 이상');
      });

      it('정원이 300 초과면 실패한다', () => {
        // When
        const result = center.changeCapacity(301);

        // Then
        expect(result.isFailure).toBe(true);
        expect(result.getError().message).toContain('300명');
      });
    });

    describe('changeIntroduction', () => {
      it('소개글을 변경한다', () => {
        // When
        const result = center.changeIntroduction('새로운 소개글');

        // Then
        expect(result.isSuccess).toBe(true);
        expect(center.introduction).toBe('새로운 소개글');
      });

      it('500자 초과면 실패한다', () => {
        // When
        const result = center.changeIntroduction('가'.repeat(501));

        // Then
        expect(result.isFailure).toBe(true);
      });
    });

    describe('changeOperatingHours', () => {
      it('운영시간을 변경한다', () => {
        // When
        const result = center.changeOperatingHours('평일 13:00-18:00');

        // Then
        expect(result.isSuccess).toBe(true);
        expect(center.operatingHours).toBe('평일 13:00-18:00');
      });

      it('100자 초과면 실패한다', () => {
        // When
        const result = center.changeOperatingHours('가'.repeat(101));

        // Then
        expect(result.isFailure).toBe(true);
      });

      it('null로 설정 가능하다', () => {
        // When
        const result = center.changeOperatingHours(null);

        // Then
        expect(result.isSuccess).toBe(true);
        expect(center.operatingHours).toBeNull();
      });
    });

    describe('activate / deactivate', () => {
      it('기관을 비활성화한다', () => {
        // When
        center.deactivate();

        // Then
        expect(center.isActive).toBe(false);
      });

      it('기관을 활성화한다', () => {
        // Given
        center.deactivate();

        // When
        center.activate();

        // Then
        expect(center.isActive).toBe(true);
      });
    });
  });
});
