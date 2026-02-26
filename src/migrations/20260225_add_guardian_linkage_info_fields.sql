-- ============================================================
-- Guardian 연계 정보 제출 필드 추가 마이그레이션
-- 생성일: 2026-02-25
--
-- voucher_linkages 테이블에 Guardian이 제출하는
-- 바우처 선정 여부 폼 필드 5개를 추가합니다.
--
-- ⚠️ 운영환경 배포 전 반드시 확인:
-- 1. 백업 완료 확인
-- 2. 개발/스테이징 환경에서 먼저 테스트
-- 3. 트랜잭션 내에서 실행 권장
--
-- 안전성:
-- - 모든 새 컬럼은 nullable 또는 default 값을 가짐
-- - 기존 행의 데이터 변경/삭제 없음
-- - 테이블 잠금 최소화 (ADD COLUMN은 메타데이터만 변경)
-- ============================================================

-- 트랜잭션 시작 (문제 발생 시 전체 롤백)
BEGIN;

-- ============================================================
-- 1. is_voucher_confirmed (바우처 선정 확인 여부)
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'voucher_linkages'
        AND column_name = 'is_voucher_confirmed'
    ) THEN
        ALTER TABLE voucher_linkages
        ADD COLUMN is_voucher_confirmed BOOLEAN NULL;
        RAISE NOTICE 'voucher_linkages.is_voucher_confirmed 컬럼 추가 완료';
    ELSE
        RAISE NOTICE 'voucher_linkages.is_voucher_confirmed 이미 존재함 - 스킵';
    END IF;
END $$;

-- ============================================================
-- 2. voucher_type (선정된 바우처 종류: 심리치유 / 정서발달)
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'voucher_linkages'
        AND column_name = 'voucher_type'
    ) THEN
        ALTER TABLE voucher_linkages
        ADD COLUMN voucher_type VARCHAR(50) NULL;
        RAISE NOTICE 'voucher_linkages.voucher_type 컬럼 추가 완료';
    ELSE
        RAISE NOTICE 'voucher_linkages.voucher_type 이미 존재함 - 스킵';
    END IF;
END $$;

-- ============================================================
-- 3. wants_platform_linkage (플랫폼 연계 희망 여부)
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'voucher_linkages'
        AND column_name = 'wants_platform_linkage'
    ) THEN
        ALTER TABLE voucher_linkages
        ADD COLUMN wants_platform_linkage BOOLEAN NULL;
        RAISE NOTICE 'voucher_linkages.wants_platform_linkage 컬럼 추가 완료';
    ELSE
        RAISE NOTICE 'voucher_linkages.wants_platform_linkage 이미 존재함 - 스킵';
    END IF;
END $$;

-- ============================================================
-- 4. linkage_decline_reason (연계 미희망 사유)
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'voucher_linkages'
        AND column_name = 'linkage_decline_reason'
    ) THEN
        ALTER TABLE voucher_linkages
        ADD COLUMN linkage_decline_reason TEXT NULL;
        RAISE NOTICE 'voucher_linkages.linkage_decline_reason 컬럼 추가 완료';
    ELSE
        RAISE NOTICE 'voucher_linkages.linkage_decline_reason 이미 존재함 - 스킵';
    END IF;
END $$;

-- ============================================================
-- 5. linkage_info_submitted (연계 정보 제출 완료 여부)
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'voucher_linkages'
        AND column_name = 'linkage_info_submitted'
    ) THEN
        ALTER TABLE voucher_linkages
        ADD COLUMN linkage_info_submitted BOOLEAN NOT NULL DEFAULT FALSE;
        RAISE NOTICE 'voucher_linkages.linkage_info_submitted 컬럼 추가 완료';
    ELSE
        RAISE NOTICE 'voucher_linkages.linkage_info_submitted 이미 존재함 - 스킵';
    END IF;
END $$;

-- ============================================================
-- 6. 검증 쿼리 (실행 결과 확인용)
-- ============================================================

-- 새 컬럼 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'voucher_linkages'
AND column_name IN (
    'is_voucher_confirmed',
    'voucher_type',
    'wants_platform_linkage',
    'linkage_decline_reason',
    'linkage_info_submitted'
)
ORDER BY ordinal_position;

-- ============================================================
-- 7. 트랜잭션 커밋
-- ============================================================
COMMIT;

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '====================================';
    RAISE NOTICE '마이그레이션 완료 - Guardian 연계 정보 필드 추가';
    RAISE NOTICE '====================================';
END $$;
