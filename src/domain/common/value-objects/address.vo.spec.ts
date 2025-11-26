import { Address } from './address.vo';

describe('Address Value Object', () => {
  describe('생성', () => {
    it('기본 주소만 있으면 Address를 생성한다', () => {
      // Given
      const props = { address: '서울시 강남구 테헤란로 123' };

      // When
      const result = Address.create(props);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().address).toBe(props.address);
      expect(result.getValue().addressDetail).toBeNull();
      expect(result.getValue().postalCode).toBeNull();
    });

    it('모든 필드를 포함한 Address를 생성한다', () => {
      // Given
      const props = {
        address: '서울시 강남구 테헤란로 123',
        addressDetail: '101동 101호',
        postalCode: '06234',
      };

      // When
      const result = Address.create(props);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().address).toBe(props.address);
      expect(result.getValue().addressDetail).toBe(props.addressDetail);
      expect(result.getValue().postalCode).toBe(props.postalCode);
    });

    it('주소 앞뒤 공백을 제거한다', () => {
      // Given
      const props = {
        address: '  서울시 강남구  ',
        addressDetail: '  101동  ',
        postalCode: '  06234  ',
      };

      // When
      const result = Address.create(props);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().address).toBe('서울시 강남구');
      expect(result.getValue().addressDetail).toBe('101동');
      expect(result.getValue().postalCode).toBe('06234');
    });

    it('기본 주소가 없으면 실패한다', () => {
      // Given
      const props = { address: '' };

      // When
      const result = Address.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('필수');
    });

    it('기본 주소가 공백만 있으면 실패한다', () => {
      // Given
      const props = { address: '   ' };

      // When
      const result = Address.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('필수');
    });

    it('기본 주소가 200자 초과면 실패한다', () => {
      // Given
      const props = { address: '가'.repeat(201) };

      // When
      const result = Address.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('최대 200자');
    });

    it('상세 주소가 100자 초과면 실패한다', () => {
      // Given
      const props = {
        address: '서울시 강남구',
        addressDetail: '가'.repeat(101),
      };

      // When
      const result = Address.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('상세 주소');
    });

    it('우편번호가 5자리 숫자가 아니면 실패한다', () => {
      // Given
      const invalidPostalCodes = ['1234', '123456', 'abcde', '1234a'];

      for (const postalCode of invalidPostalCodes) {
        // When
        const result = Address.create({
          address: '서울시 강남구',
          postalCode,
        });

        // Then
        expect(result.isFailure).toBe(true);
        expect(result.getError().message).toContain('5자리 숫자');
      }
    });

    it('빈 상세 주소는 null로 처리한다', () => {
      // Given
      const props = {
        address: '서울시 강남구',
        addressDetail: '',
      };

      // When
      const result = Address.create(props);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().addressDetail).toBeNull();
    });
  });

  describe('restore', () => {
    it('검증 없이 Address를 복원한다', () => {
      // Given
      const address = '서울시 강남구';
      const addressDetail = '101동';
      const postalCode = '06234';

      // When
      const restored = Address.restore(address, addressDetail, postalCode);

      // Then
      expect(restored.address).toBe(address);
      expect(restored.addressDetail).toBe(addressDetail);
      expect(restored.postalCode).toBe(postalCode);
    });
  });

  describe('getFullAddress', () => {
    it('상세 주소가 있으면 전체 주소를 반환한다', () => {
      // Given
      const addr = Address.create({
        address: '서울시 강남구',
        addressDetail: '101동 101호',
      }).getValue();

      // When & Then
      expect(addr.getFullAddress()).toBe('서울시 강남구 101동 101호');
    });

    it('상세 주소가 없으면 기본 주소만 반환한다', () => {
      // Given
      const addr = Address.create({
        address: '서울시 강남구',
      }).getValue();

      // When & Then
      expect(addr.getFullAddress()).toBe('서울시 강남구');
    });
  });

  describe('equals', () => {
    it('모든 필드가 같으면 true를 반환한다', () => {
      // Given
      const addr1 = Address.create({
        address: '서울시 강남구',
        addressDetail: '101동',
        postalCode: '06234',
      }).getValue();
      const addr2 = Address.create({
        address: '서울시 강남구',
        addressDetail: '101동',
        postalCode: '06234',
      }).getValue();

      // When & Then
      expect(addr1.equals(addr2)).toBe(true);
    });

    it('하나라도 다르면 false를 반환한다', () => {
      // Given
      const addr1 = Address.create({
        address: '서울시 강남구',
        addressDetail: '101동',
      }).getValue();
      const addr2 = Address.create({
        address: '서울시 강남구',
        addressDetail: '102동',
      }).getValue();

      // When & Then
      expect(addr1.equals(addr2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('전체 주소 문자열을 반환한다', () => {
      // Given
      const addr = Address.create({
        address: '서울시 강남구',
        addressDetail: '101동',
      }).getValue();

      // When & Then
      expect(addr.toString()).toBe('서울시 강남구 101동');
    });
  });
});
