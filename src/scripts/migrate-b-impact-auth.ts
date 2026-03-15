/**
 * B-IMPACT 기관 인증 필드 마이그레이션 스크립트
 *
 * 기존 B-IMPACT 기관 데이터를 유지하면서
 * password, isPasswordChanged, isActive 필드만 업데이트합니다.
 *
 * 실행 방법:
 *   yarn migrate:b-impact-auth
 *
 * 또는:
 *   npx ts-node -r tsconfig-paths/register src/scripts/migrate-b-impact-auth.ts
 *
 * 옵션:
 *   --dry-run    실제 업데이트 없이 대상 확인만 수행
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';

dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');
const DEFAULT_PASSWORD = '1234';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USERNAME || 'yeirin',
  password: process.env.DB_PASSWORD || 'yeirin123',
  database: process.env.DB_DATABASE || 'yeirin_dev',
  entities: [path.join(__dirname, '../infrastructure/persistence/typeorm/entity/*.entity.{ts,js}')],
  synchronize: false,
  ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  await dataSource.initialize();
  console.log('📊 데이터베이스 연결 성공');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN 모드 - 실제 업데이트는 수행하지 않습니다\n');
  }

  // 1. password가 NULL인 B-IMPACT 기관 조회
  const targets = await dataSource.query(
    `SELECT id, name, district FROM b_impact_voucher_institutions WHERE password IS NULL`,
  );

  console.log(`📋 업데이트 대상: ${targets.length}개 B-IMPACT 기관`);

  if (targets.length === 0) {
    console.log('✅ 모든 B-IMPACT 기관에 이미 비밀번호가 설정되어 있습니다');
    await dataSource.destroy();
    return;
  }

  // 대상 목록 출력
  targets.forEach((inst: { name: string; district: string }) => {
    console.log(`   - ${inst.district} / ${inst.name}`);
  });

  if (DRY_RUN) {
    console.log('\n🔍 DRY RUN 완료 - 위 기관들이 업데이트 대상입니다');
    await dataSource.destroy();
    return;
  }

  // 2. bcrypt 해시 생성
  console.log('\n🔐 비밀번호 해시 생성 중...');
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // 3. UPDATE 실행 (password가 NULL인 것만)
  const result = await dataSource.query(
    `UPDATE b_impact_voucher_institutions
     SET password = $1,
         "isPasswordChanged" = false,
         "isActive" = true
     WHERE password IS NULL`,
    [hashedPassword],
  );

  console.log(`✅ ${result[1]}개 B-IMPACT 기관 인증 필드 업데이트 완료`);
  console.log('\n📋 설정된 값:');
  console.log(`   🔑 초기 비밀번호: ${DEFAULT_PASSWORD} (첫 로그인 시 변경 필요)`);
  console.log('   📌 isPasswordChanged: false');
  console.log('   📌 isActive: true');

  await dataSource.destroy();
}

migrate()
  .then(() => {
    console.log('\n✅ B-IMPACT 기관 인증 마이그레이션 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  });
