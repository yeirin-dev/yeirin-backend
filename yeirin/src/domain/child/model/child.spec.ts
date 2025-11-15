import { Child } from './child';
import { BirthDate } from './value-objects/birth-date.vo';
import { ChildName } from './value-objects/child-name.vo';
import { Gender, GenderType } from './value-objects/gender.vo';

describe('Child Aggregate Root', () => {
  describe('생성', () => {
    it('부모와 연결된 아동을 생성한다', () => {
      // Given
      const childName = ChildName.create('김철수').getValue();
      const birthDate = BirthDate.create(new Date('2015-05-10')).getValue();
      const gender = Gender.create(GenderType.MALE).getValue();
      const guardianId = 'guardian-uuid-123';

      // When
      const result = Child.create({
        name: childName,
        birthDate,
        gender,
        guardianId,
        institutionId: null,
      });

      // Then
      expect(result.isSuccess).toBe(true);
      const child = result.getValue();
      expect(child.name).toEqual(childName);
      expect(child.birthDate).toEqual(birthDate);
      expect(child.gender).toEqual(gender);
      expect(child.guardianId).toBe(guardianId);
      expect(child.institutionId).toBeNull();
      expect(child.isOrphan).toBe(false);
    });

    it('양육시설과 연결된 고아를 생성한다', () => {
      // Given
      const childName = ChildName.create('이영희').getValue();
      const birthDate = BirthDate.create(new Date('2016-03-20')).getValue();
      const gender = Gender.create(GenderType.FEMALE).getValue();
      const institutionId = 'institution-uuid-456';

      // When
      const result = Child.create({
        name: childName,
        birthDate,
        gender,
        guardianId: null,
        institutionId,
      });

      // Then
      expect(result.isSuccess).toBe(true);
      const child = result.getValue();
      expect(child.guardianId).toBeNull();
      expect(child.institutionId).toBe(institutionId);
      expect(child.isOrphan).toBe(true);
    });
  });

  describe('비즈니스 규칙 검증', () => {
    const childName = ChildName.create('김철수').getValue();
    const birthDate = BirthDate.create(new Date('2015-05-10')).getValue();
    const gender = Gender.create(GenderType.MALE).getValue();

    it('보호자와 양육시설이 모두 없으면 실패한다', () => {
      // When
      const result = Child.create({
        name: childName,
        birthDate,
        gender,
        guardianId: null,
        institutionId: null,
      });

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('보호자 또는 양육시설');
    });

    it('보호자와 양육시설이 모두 있으면 실패한다', () => {
      // When
      const result = Child.create({
        name: childName,
        birthDate,
        gender,
        guardianId: 'guardian-123',
        institutionId: 'institution-456',
      });

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('하나만');
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

      const child = Child.create({
        name: childName,
        birthDate,
        gender,
        guardianId: 'guardian-123',
        institutionId: null,
      }).getValue();

      // When
      const age = child.getAge();

      // Then
      expect(age).toBe(10);
    });
  });

  describe('보호자 변경', () => {
    it('다른 보호자로 변경할 수 있다', () => {
      // Given
      const childName = ChildName.create('김철수').getValue();
      const birthDate = BirthDate.create(new Date('2015-05-10')).getValue();
      const gender = Gender.create(GenderType.MALE).getValue();

      const child = Child.create({
        name: childName,
        birthDate,
        gender,
        guardianId: 'old-guardian-123',
        institutionId: null,
      }).getValue();

      // When
      const result = child.changeGuardian('new-guardian-456');

      // Then
      expect(result.isSuccess).toBe(true);
      expect(child.guardianId).toBe('new-guardian-456');
      expect(child.institutionId).toBeNull();
    });

    it('양육시설에서 부모에게 위탁될 수 있다', () => {
      // Given
      const childName = ChildName.create('이영희').getValue();
      const birthDate = BirthDate.create(new Date('2016-03-20')).getValue();
      const gender = Gender.create(GenderType.FEMALE).getValue();

      const child = Child.create({
        name: childName,
        birthDate,
        gender,
        guardianId: null,
        institutionId: 'institution-123',
      }).getValue();

      // When
      const result = child.changeGuardian('new-parent-789');

      // Then
      expect(result.isSuccess).toBe(true);
      expect(child.guardianId).toBe('new-parent-789');
      expect(child.institutionId).toBeNull();
      expect(child.isOrphan).toBe(false);
    });
  });
});
