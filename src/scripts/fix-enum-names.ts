/**
 * PostgreSQL enum 이름 수정 스크립트
 *
 * 문제: TypeORM이 자동 생성하는 enum 이름이 PostgreSQL 63자 제한을 초과하여
 * synchronize 시 RENAME TO ..._old가 실패하는 이슈 수정
 *
 * 수행 작업:
 * 1. fast_track 엔티티의 긴 enum 이름을 짧은 이름으로 변경
 * 2. voucher_linkages_status_enum에 새 상태값 추가 (롤백으로 누락된 경우)
 *
 * 실행 방법:
 *   DB_HOST=... DB_PORT=... DB_USERNAME=... DB_PASSWORD=... DB_DATABASE=... \
 *   npx ts-node -r tsconfig-paths/register src/scripts/fix-enum-names.ts
 */

import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USERNAME || 'yeirin',
  password: process.env.DB_PASSWORD || 'yeirin123',
  database: process.env.DB_DATABASE || 'yeirin_dev',
  synchronize: false,
  ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
});

async function getEnumTypes(): Promise<string[]> {
  const result = await dataSource.query(
    `SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname`,
  );
  return result.map((r: { typname: string }) => r.typname);
}

async function getEnumValues(enumName: string): Promise<string[]> {
  const result = await dataSource.query(
    `SELECT e.enumlabel AS value
     FROM pg_enum e
     JOIN pg_type t ON t.oid = e.enumtypid
     WHERE t.typname = $1
     ORDER BY e.enumsortorder`,
    [enumName],
  );
  return result.map((r: { value: string }) => r.value);
}

async function fixEnumNames() {
  await dataSource.initialize();
  console.log('📊 데이터베이스 연결 성공\n');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN 모드\n');
  }

  const existingEnums = await getEnumTypes();
  console.log('📋 현재 enum 타입 목록:');
  existingEnums
    .filter((e) => e.includes('fast_track') || e.includes('voucher_linkages'))
    .forEach((e) => console.log(`   - ${e} (${e.length}자)`));
  console.log('');

  // ============================================
  // 1. fast_track guardian_contact_availability enum 이름 수정
  // ============================================
  const oldContactAvailName =
    'fast_track_counseling_referrals_guardian_contact_availability_e';
  const newContactAvailName = 'ft_guardian_contact_availability_enum';

  if (existingEnums.includes(oldContactAvailName)) {
    if (existingEnums.includes(newContactAvailName)) {
      console.log(`⚠️  ${newContactAvailName} 이미 존재 - 건너뜀`);
    } else {
      console.log(`🔧 RENAME: ${oldContactAvailName} → ${newContactAvailName}`);
      if (!DRY_RUN) {
        await dataSource.query(
          `ALTER TYPE "${oldContactAvailName}" RENAME TO "${newContactAvailName}"`,
        );
        console.log('   ✅ 완료');
      }
    }
  } else if (existingEnums.includes(newContactAvailName)) {
    console.log(`✅ ${newContactAvailName} 이미 올바른 이름`);
  } else {
    console.log(`⚠️  guardian_contact_availability enum을 찾을 수 없음`);
  }

  // ============================================
  // 2. fast_track guardian_consent_status enum 이름 수정
  // ============================================
  const oldConsentName =
    'fast_track_counseling_referrals_guardian_consent_status_enum';
  const newConsentName = 'ft_guardian_consent_status_enum';

  if (existingEnums.includes(oldConsentName)) {
    if (existingEnums.includes(newConsentName)) {
      console.log(`⚠️  ${newConsentName} 이미 존재 - 건너뜀`);
    } else {
      console.log(`🔧 RENAME: ${oldConsentName} → ${newConsentName}`);
      if (!DRY_RUN) {
        await dataSource.query(
          `ALTER TYPE "${oldConsentName}" RENAME TO "${newConsentName}"`,
        );
        console.log('   ✅ 완료');
      }
    }
  } else if (existingEnums.includes(newConsentName)) {
    console.log(`✅ ${newConsentName} 이미 올바른 이름`);
  } else {
    console.log(`⚠️  guardian_consent_status enum을 찾을 수 없음`);
  }

  // ============================================
  // 3. voucher_linkages_status_enum에 새 값 추가
  // ============================================
  console.log('');
  const voucherEnumName = 'voucher_linkages_status_enum';

  if (existingEnums.includes(voucherEnumName)) {
    const currentValues = await getEnumValues(voucherEnumName);
    console.log(`📋 현재 ${voucherEnumName} 값: [${currentValues.join(', ')}]`);

    const newValues = ['INSTITUTION_REVIEW', 'INSTITUTION_REJECTED'];
    for (const val of newValues) {
      if (currentValues.includes(val)) {
        console.log(`   ✅ '${val}' 이미 존재`);
      } else {
        console.log(`   🔧 ADD: '${val}'`);
        if (!DRY_RUN) {
          await dataSource.query(
            `ALTER TYPE "${voucherEnumName}" ADD VALUE IF NOT EXISTS '${val}'`,
          );
          console.log(`      ✅ 완료`);
        }
      }
    }
  } else {
    console.log(`⚠️  ${voucherEnumName}을 찾을 수 없음`);
  }

  // ============================================
  // 4. _old 잔여 타입 정리
  // ============================================
  console.log('');
  const oldTypes = existingEnums.filter((e) => e.endsWith('_old'));
  if (oldTypes.length > 0) {
    console.log('🗑️  _old 잔여 타입 정리:');
    for (const oldType of oldTypes) {
      console.log(`   DROP TYPE: ${oldType}`);
      if (!DRY_RUN) {
        try {
          await dataSource.query(`DROP TYPE IF EXISTS "${oldType}"`);
          console.log('      ✅ 완료');
        } catch (err) {
          console.log(`      ⚠️  삭제 실패 (사용 중): ${(err as Error).message}`);
        }
      }
    }
  } else {
    console.log('✅ 정리할 _old 잔여 타입 없음');
  }

  console.log('');
  await dataSource.destroy();
}

fixEnumNames()
  .then(() => {
    console.log('✅ Enum 이름 수정 스크립트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 실패:', error.message || error);
    process.exit(1);
  });
