-- ============================================================
-- Guardian 연계 정보 제출 필드 롤백 스크립트
-- 생성일: 2026-02-25
--
-- ⚠️ 주의: 이 스크립트는 Guardian이 제출한 연계 정보 데이터를 모두 삭제합니다.
-- 실행 전 반드시 백업을 확인하세요.
-- ============================================================

-- 트랜잭션 시작
BEGIN;

-- ============================================================
-- 1. 추가된 컬럼 제거
-- ============================================================
ALTER TABLE voucher_linkages
DROP COLUMN IF EXISTS is_voucher_confirmed,
DROP COLUMN IF EXISTS voucher_type,
DROP COLUMN IF EXISTS wants_platform_linkage,
DROP COLUMN IF EXISTS linkage_decline_reason,
DROP COLUMN IF EXISTS linkage_info_submitted;

-- ============================================================
-- 2. 검증
-- ============================================================
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'voucher_linkages'
ORDER BY ordinal_position;

-- 트랜잭션 커밋
COMMIT;

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '====================================';
    RAISE NOTICE '롤백 완료 - Guardian 연계 정보 필드 제거됨';
    RAISE NOTICE '====================================';
END $$;
