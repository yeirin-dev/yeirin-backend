import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CareFacilityEntity } from '../../src/infrastructure/persistence/typeorm/entity/care-facility.entity';
import { CommunityChildCenterEntity } from '../../src/infrastructure/persistence/typeorm/entity/community-child-center.entity';
import { ChildProfileEntity } from '../../src/infrastructure/persistence/typeorm/entity/child-profile.entity';
import { CounselRequestEntity } from '../../src/infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { ChildConsentEntity } from '../../src/infrastructure/persistence/typeorm/entity/child-consent.entity';
import { ChildType } from '../../src/infrastructure/persistence/typeorm/entity/enums/child-type.enum';
import { PsychologicalStatus } from '../../src/infrastructure/persistence/typeorm/entity/enums/psychological-status.enum';
import { ConsentRole } from '../../src/infrastructure/persistence/typeorm/entity/enums/consent-role.enum';
import {
  CounselRequestStatus,
  CareType,
  Gender,
  ConsentStatus,
} from '../../src/domain/counsel-request/model/value-objects/counsel-request-enums';
import { CounselRequestFormData } from '../../src/domain/counsel-request/model/value-objects/counsel-request-form-data';

/**
 * 시드 결과 인터페이스
 */
export interface SeedResult {
  careFacility: CareFacilityEntity;
  communityChildCenter: CommunityChildCenterEntity;
  careFacilityChildren: ChildProfileEntity[];
  communityCenterChildren: ChildProfileEntity[];
  counselRequests: CounselRequestEntity[];
  consents: ChildConsentEntity[];
}

/**
 * 최소 시드 결과 (개별 테스트용)
 */
export interface MinimalSeedResult {
  careFacility: CareFacilityEntity;
  communityChildCenter: CommunityChildCenterEntity;
}

/**
 * 테스트용 기본 비밀번호
 */
export const TEST_PASSWORD = 'Test1234!';
export const TEST_PASSWORD_HASH = bcrypt.hashSync(TEST_PASSWORD, 10);

/**
 * 테스트용 비밀번호 객체 (여러 유형의 비밀번호)
 */
export const TEST_PASSWORDS = {
  DEFAULT: TEST_PASSWORD,
  WRONG: 'WrongPass123!',
  NEW: 'NewPass5678!',
};

/**
 * E2E 테스트용 데이터베이스 시더
 *
 * 사용 예시:
 * ```typescript
 * // 최소 시드 (인증 테스트용)
 * const { careFacility, communityChildCenter } = await DatabaseSeeder.seedMinimal(dataSource);
 *
 * // 완전 시드 (워크플로우 테스트용)
 * const result = await DatabaseSeeder.seedComplete(dataSource);
 *
 * // 트랜잭션 롤백 (테스트 격리)
 * await DatabaseSeeder.withTransaction(dataSource, async (manager) => {
 *   // 테스트 코드
 * });
 * ```
 */
export class DatabaseSeeder {
  /**
   * 최소 시드 데이터 (개별 테스트용)
   * - 양육시설 1개
   * - 지역아동센터 1개
   */
  static async seedMinimal(dataSource: DataSource): Promise<MinimalSeedResult> {
    const manager = dataSource.manager;

    // 양육시설 생성
    const careFacility = await manager.save(CareFacilityEntity, {
      id: '00000000-0000-0000-0000-000000000001',
      name: '테스트 양육시설',
      district: '강남구',
      password: TEST_PASSWORD_HASH,
      isPasswordChanged: true,
      address: '서울특별시 강남구 테스트로 123',
      addressDetail: '1층',
      postalCode: '06123',
      representativeName: '홍길동',
      phoneNumber: '02-1234-5678',
      capacity: 50,
      establishedDate: new Date('2010-01-01'),
      introduction: '테스트용 양육시설입니다.',
      isActive: true,
    });

    // 지역아동센터 생성
    const communityChildCenter = await manager.save(CommunityChildCenterEntity, {
      id: '00000000-0000-0000-0000-000000000002',
      name: '테스트 지역아동센터',
      district: '서초구',
      region: '강남권',
      password: TEST_PASSWORD_HASH,
      isPasswordChanged: true,
      address: '서울특별시 서초구 테스트로 456',
      addressDetail: '2층',
      postalCode: '06789',
      directorName: '김철수',
      managerName: '이영희',
      managerPhone: '010-1111-2222',
      phoneNumber: '02-9876-5432',
      email: 'test@community.kr',
      expectedChildCount: 30,
      capacity: 40,
      establishedDate: new Date('2015-03-15'),
      introduction: '테스트용 지역아동센터입니다.',
      operatingHours: '평일 14:00-19:00',
      isActive: true,
    });

    return { careFacility, communityChildCenter };
  }

  /**
   * 완전 시드 데이터 (워크플로우 테스트용)
   * - 양육시설 1개 + 아동 3명
   * - 지역아동센터 1개 + 아동 3명
   * - 상담의뢰지 (각 상태별 1개씩)
   * - 동의서 (아동별 1개씩)
   */
  static async seedComplete(dataSource: DataSource): Promise<SeedResult> {
    const manager = dataSource.manager;

    // 최소 시드 먼저 수행
    const { careFacility, communityChildCenter } = await this.seedMinimal(dataSource);

    // 양육시설 아동 생성
    const careFacilityChildren = await Promise.all([
      manager.save(ChildProfileEntity, {
        id: '10000000-0000-0000-0000-000000000001',
        childType: ChildType.CARE_FACILITY,
        name: '양육시설아동1',
        birthDate: new Date('2015-03-15'),
        gender: 'MALE',
        careFacilityId: careFacility.id,
        psychologicalStatus: PsychologicalStatus.NORMAL,
      }),
      manager.save(ChildProfileEntity, {
        id: '10000000-0000-0000-0000-000000000002',
        childType: ChildType.CARE_FACILITY,
        name: '양육시설아동2',
        birthDate: new Date('2012-07-20'),
        gender: 'FEMALE',
        careFacilityId: careFacility.id,
        psychologicalStatus: PsychologicalStatus.AT_RISK,
      }),
      manager.save(ChildProfileEntity, {
        id: '10000000-0000-0000-0000-000000000003',
        childType: ChildType.CARE_FACILITY,
        name: '양육시설아동3',
        birthDate: new Date('2010-11-10'),
        gender: 'MALE',
        careFacilityId: careFacility.id,
        psychologicalStatus: PsychologicalStatus.HIGH_RISK,
      }),
    ]);

    // 지역아동센터 아동 생성
    const communityCenterChildren = await Promise.all([
      manager.save(ChildProfileEntity, {
        id: '20000000-0000-0000-0000-000000000001',
        childType: ChildType.COMMUNITY_CENTER,
        name: '센터아동1',
        birthDate: new Date('2014-05-25'),
        gender: 'FEMALE',
        communityChildCenterId: communityChildCenter.id,
        psychologicalStatus: PsychologicalStatus.NORMAL,
      }),
      manager.save(ChildProfileEntity, {
        id: '20000000-0000-0000-0000-000000000002',
        childType: ChildType.COMMUNITY_CENTER,
        name: '센터아동2',
        birthDate: new Date('2013-09-12'),
        gender: 'MALE',
        communityChildCenterId: communityChildCenter.id,
        psychologicalStatus: PsychologicalStatus.NORMAL,
      }),
      manager.save(ChildProfileEntity, {
        id: '20000000-0000-0000-0000-000000000003',
        childType: ChildType.COMMUNITY_CENTER,
        name: '센터아동3',
        birthDate: new Date('2011-01-30'),
        gender: 'FEMALE',
        communityChildCenterId: communityChildCenter.id,
        psychologicalStatus: PsychologicalStatus.AT_RISK,
      }),
    ]);

    // 상담의뢰지 생성 (각 상태별)
    const counselRequests = await Promise.all([
      // PENDING 상태
      manager.save(CounselRequestEntity, {
        id: '30000000-0000-0000-0000-000000000001',
        childId: careFacilityChildren[0].id,
        status: CounselRequestStatus.PENDING,
        formData: this.createMockFormData(careFacilityChildren[0]),
        centerName: careFacility.name,
        requestDate: new Date(),
      }),
      // RECOMMENDED 상태
      manager.save(CounselRequestEntity, {
        id: '30000000-0000-0000-0000-000000000002',
        childId: careFacilityChildren[1].id,
        status: CounselRequestStatus.RECOMMENDED,
        formData: this.createMockFormData(careFacilityChildren[1]),
        centerName: careFacility.name,
        requestDate: new Date(),
      }),
      // MATCHED 상태
      manager.save(CounselRequestEntity, {
        id: '30000000-0000-0000-0000-000000000003',
        childId: communityCenterChildren[0].id,
        status: CounselRequestStatus.MATCHED,
        formData: this.createMockFormData(communityCenterChildren[0]),
        centerName: communityChildCenter.name,
        requestDate: new Date(),
        matchedInstitutionId: '50000000-0000-0000-0000-000000000001',
      }),
      // IN_PROGRESS 상태
      manager.save(CounselRequestEntity, {
        id: '30000000-0000-0000-0000-000000000004',
        childId: communityCenterChildren[1].id,
        status: CounselRequestStatus.IN_PROGRESS,
        formData: this.createMockFormData(communityCenterChildren[1]),
        centerName: communityChildCenter.name,
        requestDate: new Date(),
        matchedInstitutionId: '50000000-0000-0000-0000-000000000001',
        matchedCounselorId: '60000000-0000-0000-0000-000000000001',
      }),
      // COMPLETED 상태
      manager.save(CounselRequestEntity, {
        id: '30000000-0000-0000-0000-000000000005',
        childId: communityCenterChildren[2].id,
        status: CounselRequestStatus.COMPLETED,
        formData: this.createMockFormData(communityCenterChildren[2]),
        centerName: communityChildCenter.name,
        requestDate: new Date(),
        matchedInstitutionId: '50000000-0000-0000-0000-000000000001',
        matchedCounselorId: '60000000-0000-0000-0000-000000000001',
      }),
    ]);

    // 동의서 생성
    const consents = await Promise.all([
      // 양육시설 아동 동의서 (14세 미만 - 아동만)
      manager.save(ChildConsentEntity, {
        id: '40000000-0000-0000-0000-000000000001',
        childId: careFacilityChildren[0].id,
        role: ConsentRole.CHILD,
        consentItems: {
          personalInfo: true,
          sensitiveData: true,
          researchData: true,
          childSelfConsent: true,
        },
        consentVersion: '1.0.0',
        consentedAt: new Date(),
        ipAddress: '127.0.0.1',
      }),
      // 지역아동센터 아동 동의서 (보호자)
      manager.save(ChildConsentEntity, {
        id: '40000000-0000-0000-0000-000000000002',
        childId: communityCenterChildren[0].id,
        role: ConsentRole.GUARDIAN,
        consentItems: {
          personalInfo: true,
          sensitiveData: true,
          researchData: false,
          childSelfConsent: false,
        },
        consentVersion: '1.0.0',
        consentedAt: new Date(),
        guardianPhone: '010-1234-5678',
        guardianRelation: '부모',
        ipAddress: '127.0.0.1',
      }),
    ]);

    return {
      careFacility,
      communityChildCenter,
      careFacilityChildren,
      communityCenterChildren,
      counselRequests,
      consents,
    };
  }

  /**
   * 다른 시설 시드 데이터 (접근 제어 테스트용)
   * - 다른 양육시설 1개 + 아동 1명
   */
  static async seedOtherFacility(dataSource: DataSource): Promise<{
    careFacility: CareFacilityEntity;
    child: ChildProfileEntity;
  }> {
    const manager = dataSource.manager;

    const careFacility = await manager.save(CareFacilityEntity, {
      id: '00000000-0000-0000-0000-000000000003',
      name: '다른 양육시설',
      district: '영등포구',
      password: TEST_PASSWORD_HASH,
      isPasswordChanged: true,
      address: '서울특별시 영등포구 테스트로 789',
      representativeName: '박영수',
      phoneNumber: '02-5555-6666',
      capacity: 30,
      establishedDate: new Date('2012-06-01'),
      isActive: true,
    });

    const child = await manager.save(ChildProfileEntity, {
      id: '10000000-0000-0000-0000-000000000099',
      childType: ChildType.CARE_FACILITY,
      name: '다른시설아동',
      birthDate: new Date('2016-02-28'),
      gender: 'MALE',
      careFacilityId: careFacility.id,
      psychologicalStatus: PsychologicalStatus.NORMAL,
    });

    return { careFacility, child };
  }

  /**
   * 비활성 시설 시드 (로그인 실패 테스트용)
   */
  static async seedInactiveFacility(dataSource: DataSource): Promise<CareFacilityEntity> {
    const manager = dataSource.manager;

    return manager.save(CareFacilityEntity, {
      id: '00000000-0000-0000-0000-000000000004',
      name: '비활성 양육시설',
      district: '강남구',
      password: TEST_PASSWORD_HASH,
      isPasswordChanged: false,
      address: '서울특별시 강남구 비활성로 111',
      representativeName: '비활성담당자',
      phoneNumber: '02-0000-0000',
      capacity: 20,
      establishedDate: new Date('2020-01-01'),
      isActive: false, // 비활성
    });
  }

  /**
   * 트랜잭션으로 테스트 격리
   * - 테스트 완료 후 자동 롤백
   */
  static async withTransaction<T>(
    dataSource: DataSource,
    fn: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    const queryRunner: QueryRunner = dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await fn(queryRunner.manager);
      // 테스트 완료 후 롤백 (데이터 정리)
      await queryRunner.rollbackTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 모든 테스트 데이터 정리
   */
  static async cleanup(dataSource: DataSource): Promise<void> {
    const manager = dataSource.manager;

    // 외래키 제약 조건 순서에 따라 삭제
    await manager.delete(ChildConsentEntity, {});
    await manager.delete(CounselRequestEntity, {});
    await manager.delete(ChildProfileEntity, {});
    await manager.delete(CareFacilityEntity, {});
    await manager.delete(CommunityChildCenterEntity, {});
  }

  /**
   * 상담의뢰지 폼 데이터 Mock 생성
   */
  private static createMockFormData(child: ChildProfileEntity): CounselRequestFormData {
    const today = new Date();
    const birthDate = new Date(child.birthDate);
    const age = today.getFullYear() - birthDate.getFullYear();

    return {
      coverInfo: {
        requestDate: {
          year: today.getFullYear(),
          month: today.getMonth() + 1,
          day: today.getDate(),
        },
        centerName: '테스트 센터',
        counselorName: '테스트 상담사',
      },
      basicInfo: {
        childInfo: {
          name: child.name,
          gender: child.gender === 'MALE' ? Gender.MALE : child.gender === 'FEMALE' ? Gender.FEMALE : Gender.OTHER,
          age: age,
          grade: age >= 7 ? `초${Math.min(age - 6, 6)}` : '미취학',
        },
        careType: CareType.GENERAL,
      },
      psychologicalInfo: {
        medicalHistory: '특이사항 없음',
        specialNotes: '테스트용 특이사항',
      },
      requestMotivation: {
        motivation: '학교생활 적응 어려움, 또래 관계 문제',
        goals: '정서적 안정 및 사회성 향상',
      },
      testResults: {
        attachedAssessments: [],
      },
      consent: ConsentStatus.AGREED,
    };
  }
}

/**
 * 테스트 데이터 ID 상수
 * - 테스트에서 참조하기 편하게 export
 * - 모든 ID는 유효한 UUID 형식이어야 함
 */
export const TEST_IDS = {
  CARE_FACILITY: '00000000-0000-0000-0000-000000000001',
  COMMUNITY_CENTER: '00000000-0000-0000-0000-000000000002',
  CARE_FACILITY_OTHER: '00000000-0000-0000-0000-000000000003',
  CARE_FACILITY_INACTIVE: '00000000-0000-0000-0000-000000000004',

  CHILDREN: {
    CARE_FACILITY: [
      '10000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000002',
      '10000000-0000-0000-0000-000000000003',
    ],
    COMMUNITY_CENTER: [
      '20000000-0000-0000-0000-000000000001',
      '20000000-0000-0000-0000-000000000002',
      '20000000-0000-0000-0000-000000000003',
    ],
    OTHER: '10000000-0000-0000-0000-000000000099',
  },

  COUNSEL_REQUESTS: {
    PENDING: '30000000-0000-0000-0000-000000000001',
    RECOMMENDED: '30000000-0000-0000-0000-000000000002',
    MATCHED: '30000000-0000-0000-0000-000000000003',
    IN_PROGRESS: '30000000-0000-0000-0000-000000000004',
    COMPLETED: '30000000-0000-0000-0000-000000000005',
  },

  CONSENTS: {
    CARE_FACILITY_CHILD: '40000000-0000-0000-0000-000000000001',
    COMMUNITY_CENTER_GUARDIAN: '40000000-0000-0000-0000-000000000002',
  },
};
