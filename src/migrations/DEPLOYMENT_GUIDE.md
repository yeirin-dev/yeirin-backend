# 바우처 연계현황 시스템 - 운영환경 배포 가이드

## 배포 순서 (반드시 순서대로 진행)

### Phase 1: 사전 준비

- [ ] **1.1 DB 백업 완료 확인**
  ```bash
  # RDS 스냅샷 또는 pg_dump
  pg_dump -h <HOST> -U <USER> -d yeirin_prod -F c -f backup_$(date +%Y%m%d_%H%M%S).dump
  ```

- [ ] **1.2 개발/스테이징 환경에서 마이그레이션 테스트**
  ```bash
  # 스테이징 DB에서 먼저 실행
  psql -h <STAGING_HOST> -U <USER> -d yeirin_staging -f 20260205_add_voucher_linkage.sql
  ```

- [ ] **1.3 배치 스크립트 DRY RUN 테스트**
  ```bash
  cd backend/yeirin
  NODE_ENV=staging npx ts-node -r tsconfig-paths/register src/scripts/backfill-voucher-eligibility.ts --dry-run
  ```

---

### Phase 2: 운영 DB 마이그레이션

- [ ] **2.1 점검 시간 공지 (필요시)**

- [ ] **2.2 운영 DB 마이그레이션 실행**
  ```bash
  psql -h <PROD_HOST> -U <USER> -d yeirin_prod -f 20260205_add_voucher_linkage.sql
  ```

- [ ] **2.3 마이그레이션 결과 확인**
  ```sql
  -- counsel_requests 컬럼 확인
  SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'counsel_requests' AND column_name LIKE '%voucher%';

  -- voucher_linkages 테이블 확인
  SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'voucher_linkages';
  ```

---

### Phase 3: 백엔드 배포

- [ ] **3.1 코드 배포**
  ```bash
  # GitHub Actions / CI 파이프라인 실행
  git push origin main  # 또는 release 브랜치
  ```

- [ ] **3.2 서버 재시작 후 헬스체크**
  ```bash
  curl https://api.yeirin.kr/health
  ```

- [ ] **3.3 API 동작 확인**
  ```bash
  # 목록 조회 (바우처 필터)
  curl "https://api.yeirin.kr/admin/counsel-requests?isVoucherEligible=true" \
    -H "Authorization: Bearer <TOKEN>"
  ```

---

### Phase 4: 기존 데이터 마이그레이션 (배치)

- [ ] **4.1 DRY RUN 실행 (운영 환경)**
  ```bash
  NODE_ENV=production npx ts-node -r tsconfig-paths/register \
    src/scripts/backfill-voucher-eligibility.ts --dry-run
  ```
  - 처리 대상 건수 확인
  - 예상 소요 시간 계산 (건수 × 0.1초)

- [ ] **4.2 실제 배치 실행**
  ```bash
  NODE_ENV=production npx ts-node -r tsconfig-paths/register \
    src/scripts/backfill-voucher-eligibility.ts
  ```

- [ ] **4.3 결과 검증**
  ```sql
  -- 바우처 추천대상 통계
  SELECT
    is_voucher_eligible,
    COUNT(*) as count
  FROM counsel_requests
  GROUP BY is_voucher_eligible;

  -- NULL 남은 건수 (Soul-E 검사결과 없는 경우)
  SELECT COUNT(*) FROM counsel_requests WHERE is_voucher_eligible IS NULL;
  ```

---

### Phase 5: 프론트엔드 배포

- [ ] **5.1 프론트엔드 빌드 & 배포**
  ```bash
  cd frontend/yeirin-admin
  yarn build
  # Vercel / S3+CloudFront 배포
  ```

- [ ] **5.2 UI 동작 확인**
  - Admin 페이지 접속
  - 바우처 추천대상 필터 동작 확인
  - 상세 모달에서 PDF 열람 확인
  - 연계 정보 생성/수정 확인

---

## 롤백 절차 (문제 발생 시)

### 즉시 롤백이 필요한 경우

```bash
# 1. 롤백 SQL 실행
psql -h <PROD_HOST> -U <USER> -d yeirin_prod -f 20260205_add_voucher_linkage_ROLLBACK.sql

# 2. 이전 버전 백엔드 배포

# 3. 이전 버전 프론트엔드 배포
```

### 부분 롤백 (배치만 롤백)

```sql
-- 바우처 컬럼만 NULL로 리셋 (테이블 구조는 유지)
UPDATE counsel_requests SET
  is_voucher_eligible = NULL,
  voucher_eligibility_reasons = NULL,
  voucher_eligibility_checked_at = NULL;

-- 연계 정보 삭제
TRUNCATE voucher_linkages;
```

---

## 안전성 보장 요약

| 작업 | 기존 데이터 영향 | 롤백 가능 |
|------|-----------------|----------|
| 컬럼 추가 (ADD COLUMN) | ❌ 없음 (NULL 추가) | ✅ DROP COLUMN |
| 테이블 생성 (CREATE TABLE) | ❌ 없음 (신규) | ✅ DROP TABLE |
| 배치 스크립트 | ❌ 없음 (UPDATE만) | ✅ SET NULL |
| ENUM 생성 | ❌ 없음 | ✅ DROP TYPE |

**모든 작업은 기존 데이터를 삭제하지 않습니다.**

---

## 연락처

문제 발생 시: [담당자 연락처]
