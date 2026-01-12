import { Child } from './child';
import { BirthDate } from './value-objects/birth-date.vo';
import { ChildName } from './value-objects/child-name.vo';
import { ChildType, ChildTypeValue } from './value-objects/child-type.vo';
import { Gender, GenderType } from './value-objects/gender.vo';
import {
  PsychologicalStatus,
  PsychologicalStatusValue,
} from './value-objects/psychological-status.vo';

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

  describe('생성 - 양육시설 아동 (CARE_FACILITY)', () => {
    it('양육시설과 연결된 아동을 생성한다', () => {
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
        educationWelfareSchoolId: null,
      });

      // Then
      expect(result.isSuccess).toBe(true);
      const child = result.getValue();
      expect(child.childType.value).toBe(ChildTypeValue.CARE_FACILITY);
      expect(child.careFacilityId).toBe(careFacilityId);
      expect(child.communityChildCenterId).toBeNull();
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
        educationWelfareSchoolId: null,
      });

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('양육시설 ID가 필수');
    });

    it('양육시설 아동에게 communityChildCenterId가 있으면 실패한다', () => {
      // Given
      const { childName, birthDate, gender, careFacilityType } = createTestData();

      // When
      const result = Child.create({
        childType: careFacilityType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: 'care-facility-123',
        communityChildCenterId: 'center-123',
        educationWelfareSchoolId: null,
      });

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('지역아동센터와 연결될 수 없습니다');
    });
  });

  describe('생성 - 지역아동센터 아동 (COMMUNITY_CENTER)', () => {
    it('지역아동센터와 연결된 아동을 생성한다', () => {
      // Given
      const { childName, birthDate, gender, communityCenterType } = createTestData();
      const communityChildCenterId = 'community-center-uuid-456';

      // When
      const result = Child.create({
        childType: communityCenterType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: null,
        communityChildCenterId,
        educationWelfareSchoolId: null,
      });

      // Then
      expect(result.isSuccess).toBe(true);
      const child = result.getValue();
      expect(child.childType.value).toBe(ChildTypeValue.COMMUNITY_CENTER);
      expect(child.careFacilityId).toBeNull();
      expect(child.communityChildCenterId).toBe(communityChildCenterId);
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
        educationWelfareSchoolId: null,
      });

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('지역아동센터 ID가 필수');
    });

    it('지역아동센터 아동에게 careFacilityId가 있으면 실패한다', () => {
      // Given
      const { childName, birthDate, gender, communityCenterType } = createTestData();

      // When
      const result = Child.create({
        childType: communityCenterType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: 'care-facility-123',
        communityChildCenterId: 'center-123',
        educationWelfareSchoolId: null,
      });

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('양육시설과 연결될 수 없습니다');
    });
  });

  describe('일반 아동 유형 (REGULAR) - 더 이상 지원 안함', () => {
    it('일반 아동 유형으로 생성하면 실패한다', () => {
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
        educationWelfareSchoolId: null,
      });

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('더 이상 지원되지 않습니다');
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
      const careFacilityType = ChildType.create(ChildTypeValue.CARE_FACILITY).getValue();

      const child = Child.create({
        childType: careFacilityType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: 'facility-123',
        communityChildCenterId: null,
        educationWelfareSchoolId: null,
      }).getValue();

      // When
      const age = child.getAge();

      // Then
      expect(age).toBe(10);
    });
  });

  describe('의료/특수요구사항 업데이트', () => {
    it('의료 정보를 업데이트한다', () => {
      // Given
      const { childName, birthDate, gender, careFacilityType } = createTestData();

      const child = Child.create({
        childType: careFacilityType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: 'facility-123',
        communityChildCenterId: null,
        educationWelfareSchoolId: null,
      }).getValue();

      // When
      child.updateMedicalInfo('ADHD 진단');

      // Then
      expect(child.medicalInfo).toBe('ADHD 진단');
    });

    it('특수 요구사항을 업데이트한다', () => {
      // Given
      const { childName, birthDate, gender, careFacilityType } = createTestData();

      const child = Child.create({
        childType: careFacilityType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: 'facility-123',
        communityChildCenterId: null,
        educationWelfareSchoolId: null,
      }).getValue();

      // When
      child.updateSpecialNeeds('감각 통합 치료 필요');

      // Then
      expect(child.specialNeeds).toBe('감각 통합 치료 필요');
    });
  });

  describe('심리 상태 업데이트', () => {
    it('심리 상태를 업데이트하고 에스컬레이션 여부를 반환한다', () => {
      // Given
      const { childName, birthDate, gender, careFacilityType } = createTestData();

      const child = Child.create({
        childType: careFacilityType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: 'facility-123',
        communityChildCenterId: null,
        educationWelfareSchoolId: null,
      }).getValue();

      const atRiskStatus = PsychologicalStatus.create(PsychologicalStatusValue.AT_RISK).getValue();

      // When
      const result = child.updatePsychologicalStatus(atRiskStatus);

      // Then
      expect(result.isSuccess).toBe(true);
      const { isEscalation, isDeescalation } = result.getValue();
      expect(isEscalation).toBe(true);
      expect(isDeescalation).toBe(false);
      expect(child.psychologicalStatus.value).toBe(PsychologicalStatusValue.AT_RISK);
    });

    it('동일한 상태로 업데이트 시 변경 없음을 반환한다', () => {
      // Given
      const { childName, birthDate, gender, careFacilityType } = createTestData();

      const child = Child.create({
        childType: careFacilityType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: 'facility-123',
        communityChildCenterId: null,
        educationWelfareSchoolId: null,
      }).getValue();

      const normalStatus = PsychologicalStatus.create(PsychologicalStatusValue.NORMAL).getValue();

      // When
      const result = child.updatePsychologicalStatus(normalStatus);

      // Then
      expect(result.isSuccess).toBe(true);
      const { isEscalation, isDeescalation } = result.getValue();
      expect(isEscalation).toBe(false);
      expect(isDeescalation).toBe(false);
    });

    it('위험 상태 확인 메서드가 동작한다', () => {
      // Given
      const { childName, birthDate, gender, careFacilityType } = createTestData();

      const child = Child.create({
        childType: careFacilityType,
        name: childName,
        birthDate,
        gender,
        careFacilityId: 'facility-123',
        communityChildCenterId: null,
        educationWelfareSchoolId: null,
      }).getValue();

      // Initially NORMAL
      expect(child.isAtRiskOrHigher()).toBe(false);
      expect(child.isHighRisk()).toBe(false);

      // Update to AT_RISK
      const atRiskStatus = PsychologicalStatus.create(PsychologicalStatusValue.AT_RISK).getValue();
      child.updatePsychologicalStatus(atRiskStatus);

      expect(child.isAtRiskOrHigher()).toBe(true);
      expect(child.isHighRisk()).toBe(false);

      // Update to HIGH_RISK
      const highRiskStatus = PsychologicalStatus.create(
        PsychologicalStatusValue.HIGH_RISK,
      ).getValue();
      child.updatePsychologicalStatus(highRiskStatus);

      expect(child.isAtRiskOrHigher()).toBe(true);
      expect(child.isHighRisk()).toBe(true);
    });
  });

  describe('DB 복원', () => {
    it('restore 메서드로 아동을 복원한다', () => {
      // Given
      const id = 'existing-child-id';
      const createdAt = new Date('2023-01-01');
      const { childName, birthDate, gender, careFacilityType } = createTestData();

      // When
      const child = Child.restore(
        {
          childType: careFacilityType,
          name: childName,
          birthDate,
          gender,
          careFacilityId: 'facility-123',
          communityChildCenterId: null,
          educationWelfareSchoolId: null,
        },
        id,
        createdAt,
      );

      // Then
      expect(child.id).toBe(id);
      expect(child.createdAt).toBe(createdAt);
      expect(child.careFacilityId).toBe('facility-123');
    });
  });
});
