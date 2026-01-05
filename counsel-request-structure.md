# 상담의뢰지 데이터 구조 설계

## JSONB 구조 (영어 key + 한글 주석)

```typescript
interface CounselRequestFormData {
  // ============================================
  // 1. 표지 정보
  // ============================================
  coverInfo: {
    requestDate: {
      year: number;      // 년
      month: number;     // 월 (1-12)
      day: number;       // 일 (1-31)
    };
    centerName: string;      // 센터명
    counselorName: string;   // 담당자 이름
  };

  // ============================================
  // 2. 기본정보
  // ============================================
  basicInfo: {
    // 아동 정보
    childInfo: {
      name: string;                    // 이름
      gender: 'MALE' | 'FEMALE';       // 성별
      age: number;                     // 연령
      grade: string;                   // 학년 (예: "초1", "중2", "미취학")
    };

    // 센터 이용 기준
    careType: 'PRIORITY' | 'GENERAL' | 'SPECIAL';
    // PRIORITY: 우선돌봄 / GENERAL: 일반 / SPECIAL: 돌봄특례

    // 우선돌봄 세부 사유 (careType === 'PRIORITY'일 때만)
    priorityReason?:
      | 'BASIC_LIVELIHOOD'      // 기초생활보장 수급권자
      | 'LOW_INCOME'            // 차상위계층 가구의 아동
      | 'MEDICAL_AID'           // 의료급여 수급권자
      | 'DISABILITY'            // 장애가구의 아동 또는 장애 아동
      | 'MULTICULTURAL'         // 다문화가족의 아동
      | 'SINGLE_PARENT'         // 한부모가족의 아동
      | 'GRANDPARENT'           // 조손가구의 아동
      | 'EDUCATION_SUPPORT'     // 초중고 교육비 지원 대상 아동
      | 'MULTI_CHILD';          // 자녀가 2명 이상인 가구의 아동
  };

  // ============================================
  // 3. 정서·심리 관련 정보
  // ============================================
  psychologicalInfo: {
    medicalHistory: string;        // 기존 아동 병력 (긴 텍스트)
    specialNotes: string;          // 병력 외 특이사항 (긴 텍스트)
  };

  // ============================================
  // 4. 의뢰동기 및 상담목표
  // ============================================
  requestMotivation: {
    motivation: string;            // 의뢰 동기 (긴 텍스트)
    goals: string;                 // 보호자 및 의뢰자의 목표 (긴 텍스트)
  };

  // ============================================
  // 5. 소울이 검사결과지 첨부
  // ============================================
  testResults: {
    childReactionScale?: string;   // 1. 아동 반응척도 심리검사 (이미지 URL)
    strengthSurvey?: string;       // 2. 강점 설문지 심리검사 (이미지 URL)
    difficultySurvey?: string;     // 3. 난점 설문지 심리검사 (이미지 URL)
  };

  // ============================================
  // 6. 보호자 동의 여부
  // ============================================
  consent: 'AGREED' | 'DISAGREED';
}
```

---

## Entity 설계

```typescript
@Entity('counsel_requests')
export class CounselRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 관계
  @Column({ type: 'uuid' })
  childId: string;

  @ManyToOne(() => ChildEntity)
  @JoinColumn({ name: 'child_id' })
  child: ChildEntity;

  @Column({ type: 'uuid' })
  guardianId: string;

  @ManyToOne(() => GuardianProfileEntity)
  @JoinColumn({ name: 'guardian_id' })
  guardian: GuardianProfileEntity;

  // 상태 관리
  @Column({
    type: 'enum',
    enum: ['PENDING', 'MATCHED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'],
    default: 'PENDING',
  })
  status: CounselRequestStatus;

  // 🎯 전체 양식 데이터 (JSONB)
  @Column({ type: 'jsonb' })
  formData: CounselRequestFormData;

  // 검색/필터링용 필드 (JSONB에서 추출)
  @Column({ nullable: true })
  centerName?: string;  // 빠른 검색용

  @Column({ type: 'enum', nullable: true })
  careType?: 'PRIORITY' | 'GENERAL' | 'SPECIAL';

  @Column({ type: 'date', nullable: true })
  requestDate?: Date;  // 의뢰일자

  // 매칭 정보
  @Column({ type: 'uuid', nullable: true })
  matchedInstitutionId?: string;

  @Column({ type: 'uuid', nullable: true })
  matchedCounselorId?: string;

  // 타임스탬프
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## Enum 정의

```typescript
// src/domain/counsel-request/model/value-objects/counsel-request-enums.ts

export enum CounselRequestStatus {
  PENDING = 'PENDING',           // 접수 대기
  MATCHED = 'MATCHED',           // 매칭 완료
  IN_PROGRESS = 'IN_PROGRESS',   // 상담 진행 중
  COMPLETED = 'COMPLETED',       // 상담 완료
  REJECTED = 'REJECTED',         // 매칭 거부
}

export enum CareType {
  PRIORITY = 'PRIORITY',   // 우선돌봄 아동
  GENERAL = 'GENERAL',     // 일반 아동
  SPECIAL = 'SPECIAL',     // 돌봄 특례 아동
}

export enum PriorityReason {
  BASIC_LIVELIHOOD = 'BASIC_LIVELIHOOD',      // 기초생활보장 수급권자
  LOW_INCOME = 'LOW_INCOME',                  // 차상위계층 가구의 아동
  MEDICAL_AID = 'MEDICAL_AID',                // 의료급여 수급권자
  DISABILITY = 'DISABILITY',                  // 장애가구의 아동 또는 장애 아동
  MULTICULTURAL = 'MULTICULTURAL',            // 다문화가족의 아동
  SINGLE_PARENT = 'SINGLE_PARENT',            // 한부모가족의 아동
  GRANDPARENT = 'GRANDPARENT',                // 조손가구의 아동
  EDUCATION_SUPPORT = 'EDUCATION_SUPPORT',    // 초중고 교육비 지원 대상 아동
  MULTI_CHILD = 'MULTI_CHILD',                // 자녀가 2명 이상인 가구의 아동
}

export enum Gender {
  MALE = 'MALE',       // 남
  FEMALE = 'FEMALE',   // 여
}

export enum ConsentStatus {
  AGREED = 'AGREED',         // 동의
  DISAGREED = 'DISAGREED',   // 미동의
}
```

---

## Swagger DTO 예시 (한글 설명)

```typescript
export class CreateCounselRequestDto {
  @ApiProperty({ description: '아동 ID' })
  @IsUUID()
  childId: string;

  @ApiProperty({ description: '표지 정보' })
  @IsObject()
  @ValidateNested()
  @Type(() => CoverInfoDto)
  coverInfo: CoverInfoDto;

  @ApiProperty({ description: '기본 정보' })
  @IsObject()
  @ValidateNested()
  @Type(() => BasicInfoDto)
  basicInfo: BasicInfoDto;

  // ... 나머지 필드
}

class CoverInfoDto {
  @ApiProperty({ description: '의뢰 일자' })
  @ValidateNested()
  @Type(() => RequestDateDto)
  requestDate: RequestDateDto;

  @ApiProperty({ description: '센터명', example: '서울아동발달센터' })
  @IsString()
  centerName: string;

  @ApiProperty({ description: '담당자 이름', example: '홍길동' })
  @IsString()
  counselorName: string;
}
```

---

## 결론

✅ **영어 key 사용 권장 이유**:
1. TypeScript dot notation 사용 가능
2. DB 쿼리 편의성
3. 표준 REST API 관행
4. 국제화 대비
5. 라이브러리 호환성

✅ **한글은 다음에서 사용**:
- Swagger 문서 (`@ApiProperty description`)
- 코드 주석
- Enum 값 (선택적)
- 사용자 대면 UI
