import { Child } from './child';
import { BirthDate } from './value-objects/birth-date.vo';
import { ChildName } from './value-objects/child-name.vo';
import { ChildType, ChildTypeValue } from './value-objects/child-type.vo';
import { Gender, GenderType } from './value-objects/gender.vo';

describe('Child Aggregate Root', () => {
  // 공통 테스트 데이터
  const createTestData = () => ({
    childName: ChildName.create('김철수').getValue(),
    birthDate: BirthDate.create(new Date('2015-05-10')).getValue(),
    gender: Gender.create(GenderType.MALE).getValue(),
    careFacilityType: ChildType.create(ChildTypeValue.CARE_FACILITY).getValue(),
    communityCenterType: ChildType.create(ChildTypeValue.COMMUNITY_CENTER).getValue(),
    regularType: ChildType.create(ChildTypeValue.REGULAR).getValue(),
  });

  describe('생성 - 양육시설 아동 (CARE_FACILITY, 고아)', () => {
    it('양육시설과 연결된 고아를 생성한다', () => {
      // Given
      const { childName, birthDate, gender, careFacilityType } = createTestData();
      const careFacilityId = 'care-facility-uuid-123';

      // When
      const result = Child.create({
        childType: careFacilityType,
        name: childName,
        birthDate,
        gender,
        careFacilityId,
        communityChildCenterId: null,
        guardianId: null,
      });

      // Then
      expect(result.isSuccess).toBe(true);
      const child = result.getValue();
      expect(child.childType.value).toBe(ChildTypeValue.CARE_FACILITY);
      expect(child.careFacilityId).toBe(careFacilityId);
      expect(child.communityChildCenterId).toBeNull();
      expect(child.guardianId).toBeNull();
      expect(child.isOrphan).toBe(true);
    });

    it('양육시설 아동에게 careFacilityId가 없으면 실패한다', () => {
      // Given
      const { childName, birthDate, gender, careFacilityType } = createTestData();

      // When
      const result = Child.create({
        childType: careFacilityType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: null,
        communityChildCenterId: null,
        guardianId: null,
      });

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('양육시설 ID가 필수');
    });

    it('양육시설 아동에게 guardianId가 있으면 실패한다', () => {
      // Given
      const { childName, birthDate, gender, careFacilityType } = createTestData();

      // When
      const result = Child.create({
        childType: careFacilityType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: 'care-facility-123',
        communityChildCenterId: null,
        guardianId: 'guardian-123', // 양육시설 아동은 부모 보호자가 없어야 함
      });

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('부모 보호자와 연결될 수 없습니다');
    });
  });

  describe('생성 - 지역아동센터 아동 (COMMUNITY_CENTER)', () => {
    it('지역아동센터와 부모가 연결된 아동을 생성한다', () => {
      // Given
      const { childName, birthDate, gender, communityCenterType } = createTestData();
      const communityChildCenterId = 'community-center-uuid-456';
      const guardianId = 'guardian-uuid-789';

      // When
      const result = Child.create({
        childType: communityCenterType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: null,
        communityChildCenterId,
        guardianId,
      });

      // Then
      expect(result.isSuccess).toBe(true);
      const child = result.getValue();
      expect(child.childType.value).toBe(ChildTypeValue.COMMUNITY_CENTER);
      expect(child.careFacilityId).toBeNull();
      expect(child.communityChildCenterId).toBe(communityChildCenterId);
      expect(child.guardianId).toBe(guardianId);
      expect(child.isOrphan).toBe(false);
    });

    it('지역아동센터 아동에게 communityChildCenterId가 없으면 실패한다', () => {
      // Given
      const { childName, birthDate, gender, communityCenterType } = createTestData();

      // When
      const result = Child.create({
        childType: communityCenterType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: null,
        communityChildCenterId: null,
        guardianId: 'guardian-123',
      });

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('지역아동센터 ID가 필수');
    });

    it('지역아동센터 아동에게 guardianId가 없으면 실패한다', () => {
      // Given
      const { childName, birthDate, gender, communityCenterType } = createTestData();

      // When
      const result = Child.create({
        childType: communityCenterType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: null,
        communityChildCenterId: 'community-center-123',
        guardianId: null,
      });

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('부모 보호자 ID가 필수');
    });
  });

  describe('생성 - 일반 아동 (REGULAR, 부모 직접보호)', () => {
    it('부모와 연결된 일반 아동을 생성한다', () => {
      // Given
      const { childName, birthDate, gender, regularType } = createTestData();
      const guardianId = 'guardian-uuid-123';

      // When
      const result = Child.create({
        childType: regularType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: null,
        communityChildCenterId: null,
        guardianId,
      });

      // Then
      expect(result.isSuccess).toBe(true);
      const child = result.getValue();
      expect(child.childType.value).toBe(ChildTypeValue.REGULAR);
      expect(child.careFacilityId).toBeNull();
      expect(child.communityChildCenterId).toBeNull();
      expect(child.guardianId).toBe(guardianId);
      expect(child.isOrphan).toBe(false);
    });

    it('일반 아동에게 guardianId가 없으면 실패한다', () => {
      // Given
      const { childName, birthDate, gender, regularType } = createTestData();

      // When
      const result = Child.create({
        childType: regularType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: null,
        communityChildCenterId: null,
        guardianId: null,
      });

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('부모 보호자 ID가 필수');
    });

    it('일반 아동에게 careFacilityId가 있으면 실패한다', () => {
      // Given
      const { childName, birthDate, gender, regularType } = createTestData();

      // When
      const result = Child.create({
        childType: regularType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: 'care-facility-123',
        communityChildCenterId: null,
        guardianId: 'guardian-123',
      });

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('양육시설과 연결될 수 없습니다');
    });
  });

  describe('나이 조회', () => {
    it('현재 나이를 반환한다', () => {
      // Given
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

      const childName = ChildName.create('김철수').getValue();
      const birthDate = BirthDate.create(tenYearsAgo).getValue();
      const gender = Gender.create(GenderType.MALE).getValue();
      const regularType = ChildType.create(ChildTypeValue.REGULAR).getValue();

      const child = Child.create({
        childType: regularType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: null,
        communityChildCenterId: null,
        guardianId: 'guardian-123',
      }).getValue();

      // When
      const age = child.getAge();

      // Then
      expect(age).toBe(10);
    });
  });

  describe('보호자 변경', () => {
    it('일반 아동의 보호자를 변경할 수 있다', () => {
      // Given
      const { childName, birthDate, gender, regularType } = createTestData();

      const child = Child.create({
        childType: regularType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: null,
        communityChildCenterId: null,
        guardianId: 'old-guardian-123',
      }).getValue();

      // When
      const result = child.changeGuardian('new-guardian-456');

      // Then
      expect(result.isSuccess).toBe(true);
      expect(child.guardianId).toBe('new-guardian-456');
    });

    it('지역아동센터 아동의 보호자를 변경할 수 있다', () => {
      // Given
      const { childName, birthDate, gender, communityCenterType } = createTestData();

      const child = Child.create({
        childType: communityCenterType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: null,
        communityChildCenterId: 'center-123',
        guardianId: 'old-guardian-123',
      }).getValue();

      // When
      const result = child.changeGuardian('new-guardian-456');

      // Then
      expect(result.isSuccess).toBe(true);
      expect(child.guardianId).toBe('new-guardian-456');
    });

    it('양육시설 아동은 보호자를 변경할 수 없다', () => {
      // Given
      const { childName, birthDate, gender, careFacilityType } = createTestData();

      const child = Child.create({
        childType: careFacilityType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: 'facility-123',
        communityChildCenterId: null,
        guardianId: null,
      }).getValue();

      // When
      const result = child.changeGuardian('new-guardian-456');

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('입양 절차');
    });
  });

  describe('입양 처리', () => {
    it('양육시설 아동을 입양하면 일반 아동으로 전환된다', () => {
      // Given
      const { childName, birthDate, gender, careFacilityType } = createTestData();

      const child = Child.create({
        childType: careFacilityType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: 'facility-123',
        communityChildCenterId: null,
        guardianId: null,
      }).getValue();

      // When
      const result = child.processAdoption('new-parent-789');

      // Then
      expect(result.isSuccess).toBe(true);
      const adoptedChild = result.getValue();
      expect(adoptedChild.childType.value).toBe(ChildTypeValue.REGULAR);
      expect(adoptedChild.guardianId).toBe('new-parent-789');
      expect(adoptedChild.careFacilityId).toBeNull();
      expect(adoptedChild.isOrphan).toBe(false);
    });

    it('양육시설 아동이 아닌 경우 입양 처리할 수 없다', () => {
      // Given
      const { childName, birthDate, gender, regularType } = createTestData();

      const child = Child.create({
        childType: regularType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: null,
        communityChildCenterId: null,
        guardianId: 'guardian-123',
      }).getValue();

      // When
      const result = child.processAdoption('new-parent-789');

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('양육시설 아동만');
    });
  });

  describe('의료/특수요구사항 업데이트', () => {
    it('의료 정보를 업데이트한다', () => {
      // Given
      const { childName, birthDate, gender, regularType } = createTestData();

      const child = Child.create({
        childType: regularType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: null,
        communityChildCenterId: null,
        guardianId: 'guardian-123',
      }).getValue();

      // When
      child.updateMedicalInfo('ADHD 진단');

      // Then
      expect(child.medicalInfo).toBe('ADHD 진단');
    });

    it('특수 요구사항을 업데이트한다', () => {
      // Given
      const { childName, birthDate, gender, regularType } = createTestData();

      const child = Child.create({
        childType: regularType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: null,
        communityChildCenterId: null,
        guardianId: 'guardian-123',
      }).getValue();

      // When
      child.updateSpecialNeeds('감각 통합 치료 필요');

      // Then
      expect(child.specialNeeds).toBe('감각 통합 치료 필요');
    });
  });
});
