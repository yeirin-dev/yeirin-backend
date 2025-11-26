# CounselReport (면담결과지) 기능 구조

## 📋 개요

**면담결과지**는 바우처 연계 후 매 회차 상담마다 상담사가 작성하는 결과 보고서입니다.

- **상담의뢰지 (CounselRequest)**: 1번 (바우처 선별용 증빙자료)
- **면담결과지 (CounselReport)**: 여러번 (매 회차 상담 후 작성)
- **관계**: 1 CounselRequest → N CounselReports (회차별)

## 🏗️ DDD 아키텍처 구조

```
src/
├── domain/counsel-report/                      # Domain Layer (순수 비즈니스 로직)
│   ├── model/
│   │   ├── counsel-report.ts                  # Aggregate Root
│   │   └── value-objects/
│   │       └── report-status.ts               # 상태 VO + 전환 규칙
│   └── repository/
│       └── counsel-report.repository.ts       # Repository 인터페이스
│
├── application/counsel-report/                 # Application Layer (Use Cases)
│   ├── dto/
│   │   ├── create-counsel-report.dto.ts       # 생성 DTO
│   │   ├── update-counsel-report.dto.ts       # 수정 DTO
│   │   ├── approve-counsel-report.dto.ts      # 승인 DTO
│   │   ├── counsel-report-response.dto.ts     # 응답 DTO
│   │   └── index.ts
│   └── use-cases/
│       ├── create-counsel-report.use-case.ts  # 생성
│       ├── update-counsel-report.use-case.ts  # 수정
│       ├── submit-counsel-report.use-case.ts  # 제출
│       ├── get-counsel-report.use-case.ts     # 단건 조회
│       ├── get-counsel-reports-by-request.use-case.ts  # 의뢰지별 조회
│       ├── review-counsel-report.use-case.ts  # 보호자 확인
│       ├── approve-counsel-report.use-case.ts # 보호자 승인
│       └── index.ts
│
├── infrastructure/persistence/typeorm/         # Infrastructure Layer
│   ├── entity/
│   │   └── counsel-report.entity.ts           # TypeORM Entity
│   ├── mapper/
│   │   └── counsel-report.mapper.ts           # Domain ↔ Entity 변환
│   └── repository/
│       └── counsel-report.repository.impl.ts  # Repository 구현체
│
└── presentation/counsel-report/                # Presentation Layer
    ├── counsel-report.controller.ts           # REST API Controller
    └── counsel-report.module.ts               # NestJS Module
```

## 📊 데이터 모델

### Domain Model (CounselReport)

```typescript
interface CounselReportProps {
  id: string;
  counselRequestId: string;  // FK → CounselRequest
  childId: string;           // FK → Child
  counselorId: string;       // FK → Counselor
  institutionId: string;     // FK → VoucherInstitution
  sessionNumber: number;     // 회차 (1, 2, 3, ...)
  reportDate: Date;          // 의뢰(작성)일자
  centerName: string;        // 센터명
  counselorSignature: string | null;  // 상담사 서명 (이미지 URL)
  counselReason: string;     // 상담 사유
  counselContent: string;    // 상담 내용
  centerFeedback: string | null;     // 센터 피드백
  homeFeedback: string | null;       // 가정 피드백
  attachmentUrls: string[];  // 첨부 파일 URL 목록
  status: ReportStatus;      // 상태
  submittedAt: Date | null;  // 제출 시각
  reviewedAt: Date | null;   // 확인 시각
  guardianFeedback: string | null;   // 보호자 피드백
  createdAt: Date;
  updatedAt: Date;
}
```

### ReportStatus (상태 전환)

```typescript
enum ReportStatus {
  DRAFT = 'DRAFT',           // 작성 중
  SUBMITTED = 'SUBMITTED',   // 제출됨
  REVIEWED = 'REVIEWED',     // 확인됨
  APPROVED = 'APPROVED',     // 승인됨
}

// 상태 전환 규칙
DRAFT → SUBMITTED (상담사 제출)
SUBMITTED → REVIEWED (보호자 확인)
SUBMITTED → DRAFT (반려)
REVIEWED → APPROVED (보호자 승인 + 피드백)
```

## 🔄 비즈니스 플로우

### 1. 작성 단계 (상담사)
```
상담사가 상담 후 면담결과지 작성 (DRAFT)
↓
내용 수정 가능 (DRAFT 상태에서만)
↓
작성 완료 후 제출 (DRAFT → SUBMITTED)
```

### 2. 검토 단계 (보호자)
```
제출된 면담결과지 확인 (SUBMITTED → REVIEWED)
↓
피드백 작성 후 승인 (REVIEWED → APPROVED)
```

### 3. 반려 (필요시)
```
보호자/관리자가 반려 (SUBMITTED → DRAFT)
↓
상담사가 수정 후 재제출
```

## 🎯 주요 기능

### 상담사 (COUNSELOR)
- ✅ 면담결과지 생성 (DRAFT)
- ✅ 면담결과지 수정 (DRAFT 상태만)
- ✅ 면담결과지 제출 (DRAFT → SUBMITTED)
- ✅ 자신이 작성한 면담결과지 조회

### 보호자 (GUARDIAN)
- ✅ 제출된 면담결과지 확인 (SUBMITTED → REVIEWED)
- ✅ 피드백 작성 및 승인 (REVIEWED → APPROVED)
- ✅ 자녀의 모든 면담결과지 조회

### 기관 관리자 (INSTITUTION_ADMIN)
- ✅ 소속 기관의 모든 면담결과지 조회
- ✅ 통계 및 리포트

## 🗄️ 데이터베이스 스키마

```sql
CREATE TABLE counsel_reports (
  id UUID PRIMARY KEY,
  counsel_request_id UUID NOT NULL REFERENCES counsel_requests(id),
  child_id UUID NOT NULL REFERENCES child_profiles(id),
  counselor_id UUID NOT NULL REFERENCES counselor_profiles(user_id),
  institution_id UUID NOT NULL REFERENCES voucher_institutions(user_id),
  session_number INTEGER NOT NULL,
  report_date DATE NOT NULL,
  center_name VARCHAR(200) NOT NULL,
  counselor_signature TEXT,
  counsel_reason TEXT NOT NULL,
  counsel_content TEXT NOT NULL,
  center_feedback TEXT,
  home_feedback TEXT,
  attachment_urls TEXT[], -- 배열
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  guardian_feedback TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- 제약 조건
  UNIQUE(counsel_request_id, session_number), -- 같은 의뢰지에 같은 회차 중복 불가
  CHECK (session_number >= 1)
);

-- 인덱스
CREATE INDEX idx_counsel_reports_counsel_request_id ON counsel_reports(counsel_request_id);
CREATE INDEX idx_counsel_reports_child_id ON counsel_reports(child_id);
CREATE INDEX idx_counsel_reports_counselor_id ON counsel_reports(counselor_id);
CREATE INDEX idx_counsel_reports_institution_id ON counsel_reports(institution_id);
CREATE INDEX idx_counsel_reports_status ON counsel_reports(status);
```

## 🔌 API 엔드포인트

### 상담사 전용
```
POST   /counsel-reports                    # 면담결과지 생성
PATCH  /counsel-reports/:id                # 면담결과지 수정
POST   /counsel-reports/:id/submit         # 면담결과지 제출
```

### 보호자 전용
```
POST   /counsel-reports/:id/review         # 면담결과지 확인
POST   /counsel-reports/:id/approve        # 면담결과지 승인 (피드백 포함)
```

### 공통
```
GET    /counsel-reports/:id                           # 단건 조회
GET    /counsel-reports/counsel-request/:requestId    # 의뢰지별 목록
```

## 🧪 테스트 항목 (TODO)

### Unit Tests
- [ ] Domain Model 테스트
  - [ ] CounselReport.create() 유효성 검증
  - [ ] 상태 전환 (submit, markAsReviewed, approve, reject)
  - [ ] 비즈니스 규칙 검증
- [ ] Value Object 테스트
  - [ ] ReportStatus 전환 규칙
- [ ] Use Case 테스트
  - [ ] CreateCounselReportUseCase
  - [ ] UpdateCounselReportUseCase
  - [ ] SubmitCounselReportUseCase
  - [ ] ApproveCounselReportUseCase

### Integration Tests
- [ ] Repository 테스트
  - [ ] CRUD 동작
  - [ ] 쿼리 메서드
- [ ] Controller 테스트
  - [ ] API 엔드포인트
  - [ ] 권한 검증
  - [ ] 응답 형식

### E2E Tests
- [ ] 상담사 플로우
  - [ ] 생성 → 수정 → 제출
- [ ] 보호자 플로우
  - [ ] 확인 → 승인
- [ ] 반려 플로우

## 📝 비즈니스 규칙

### 필수 검증
1. **회차 유니크**: 같은 상담의뢰지에 같은 회차 중복 불가
2. **회차 번호**: 1 이상
3. **필수 필드**: counselReason, counselContent 비어있을 수 없음
4. **수정 권한**: DRAFT 상태에서만 수정 가능
5. **제출 조건**: 필수 내용 모두 작성 완료
6. **상태 전환**: 정의된 전환 규칙만 허용

### 권한 규칙
1. **상담사**: 본인이 작성한 결과지만 수정/제출 가능
2. **보호자**: 자녀의 결과지만 확인/승인 가능
3. **기관 관리자**: 소속 기관의 결과지만 조회 가능

## 🚀 다음 단계

### 우선순위 1 (필수)
- [ ] 테스트 코드 작성
- [ ] 보호자 권한 확인 로직 구현 (ChildRepository 연동)
- [ ] 에러 메시지 다국어화
- [ ] API 문서 자동 생성 확인

### 우선순위 2 (개선)
- [ ] 파일 첨부 기능 (S3/MinIO 연동)
- [ ] PDF 자동 생성 (면담결과지 양식)
- [ ] 이메일 알림 (제출/승인 시)
- [ ] 통계 API (기관별, 상담사별, 아동별)

### 우선순위 3 (향후)
- [ ] 버전 관리 (수정 이력)
- [ ] 템플릿 관리 (기관별 양식)
- [ ] 전자 서명 (블록체인 연동)
- [ ] 실시간 알림 (WebSocket)

## 📚 참고 문서

- PDF 원본: `25.09.02) 소울이 서비스 공급기관 면담결과지_최종.pdf`
- 프로젝트 개발 표준: `claude.md`
- ERD: `counsel-request-structure.md` (상담의뢰지)
