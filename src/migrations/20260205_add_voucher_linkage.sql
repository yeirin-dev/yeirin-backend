-- ============================================================
-- 바우처 연계현황 시스템 마이그레이션
-- 생성일: 2026-02-05
--
-- ⚠️ 운영환경 배포 전 반드시 확인:
-- 1. 백업 완료 확인
-- 2. 개발/스테이징 환경에서 먼저 테스트
-- 3. 트랜잭션 내에서 실행 권장
-- ============================================================

-- 트랜잭션 시작 (문제 발생 시 전체 롤백)
BEGIN;

-- ============================================================
-- 1. ENUM 타입 생성 (voucher_linkage_status)
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'voucher_linkage_status') THEN
        CREATE TYPE voucher_linkage_status AS ENUM ('PENDING', 'COMPLETED');
        RAISE NOTICE 'ENUM voucher_linkage_status 생성 완료';
    ELSE
        RAISE NOTICE 'ENUM voucher_linkage_status 이미 존재함 - 스킵';
    END IF;
END $$;

-- ============================================================
-- 2. counsel_requests 테이블에 바우처 컬럼 추가
--    (기존 데이터 영향 없음 - ADD COLUMN은 안전)
-- ============================================================

-- 2.1 is_voucher_eligible 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'counsel_requests'
        AND column_name = 'is_voucher_eligible'
    ) THEN
        ALTER TABLE counsel_requests
        ADD COLUMN is_voucher_eligible BOOLEAN NULL;
        RAISE NOTICE 'counsel_requests.is_voucher_eligible 컬럼 추가 완료';
    ELSE
        RAISE NOTICE 'counsel_requests.is_voucher_eligible 이미 존재함 - 스킵';
    END IF;
END $$;

-- 2.2 voucher_eligibility_reasons 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'counsel_requests'
        AND column_name = 'voucher_eligibility_reasons'
    ) THEN
        ALTER TABLE counsel_requests
        ADD COLUMN voucher_eligibility_reasons TEXT[] NULL;
        RAISE NOTICE 'counsel_requests.voucher_eligibility_reasons 컬럼 추가 완료';
    ELSE
        RAISE NOTICE 'counsel_requests.voucher_eligibility_reasons 이미 존재함 - 스킵';
    END IF;
END $$;

-- 2.3 voucher_eligibility_checked_at 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'counsel_requests'
        AND column_name = 'voucher_eligibility_checked_at'
    ) THEN
        ALTER TABLE counsel_requests
        ADD COLUMN voucher_eligibility_checked_at TIMESTAMP NULL;
        RAISE NOTICE 'counsel_requests.voucher_eligibility_checked_at 컬럼 추가 완료';
    ELSE
        RAISE NOTICE 'counsel_requests.voucher_eligibility_checked_at 이미 존재함 - 스킵';
    END IF;
END $$;

-- 2.4 counsel_requests 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_counsel_requests_voucher_eligible
    ON counsel_requests (is_voucher_eligible);

CREATE INDEX IF NOT EXISTS idx_counsel_requests_status_voucher
    ON counsel_requests (status, is_voucher_eligible);

-- ============================================================
-- 3. voucher_linkages 테이블 생성
--    (신규 테이블 - 기존 데이터 영향 없음)
-- ============================================================
CREATE TABLE IF NOT EXISTS voucher_linkages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counsel_request_id UUID NOT NULL UNIQUE,
    status voucher_linkage_status NOT NULL DEFAULT 'PENDING',
    linked_institution_name VARCHAR(200) NULL,
    linked_institution_phone VARCHAR(50) NULL,
    linked_institution_address VARCHAR(500) NULL,
    linked_counselor_name VARCHAR(100) NULL,
    linked_at TIMESTAMP NULL,
    notes TEXT NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Foreign Key (counsel_requests 테이블 참조)
    CONSTRAINT fk_voucher_linkages_counsel_request
        FOREIGN KEY (counsel_request_id)
        REFERENCES counsel_requests(id)
        ON DELETE CASCADE
);

-- 3.1 voucher_linkages 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_voucher_linkages_status
    ON voucher_linkages (status);

CREATE INDEX IF NOT EXISTS idx_voucher_linkages_counsel_request
    ON voucher_linkages (counsel_request_id);

CREATE INDEX IF NOT EXISTS idx_voucher_linkages_linked_at
    ON voucher_linkages (linked_at);

-- ============================================================
-- 4. 검증 쿼리 (실행 결과 확인용)
-- ============================================================

-- counsel_requests 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'counsel_requests'
AND column_name LIKE '%voucher%'
ORDER BY ordinal_position;

-- voucher_linkages 테이블 존재 확인
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'voucher_linkages'
ORDER BY ordinal_position;

-- 인덱스 확인
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('counsel_requests', 'voucher_linkages')
AND indexname LIKE '%voucher%';

-- ============================================================
-- 5. 트랜잭션 커밋
-- ============================================================
COMMIT;

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '====================================';
    RAISE NOTICE '마이그레이션 완료';
    RAISE NOTICE '====================================';
END $$;
