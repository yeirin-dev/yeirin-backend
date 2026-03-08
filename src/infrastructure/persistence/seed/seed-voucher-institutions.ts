import * as path from 'path';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { bImpactVoucherInstitutionsData } from './data/b-impact-voucher-institutions.data';
import { commonVoucherInstitutionsData } from './data/common-voucher-institutions.data';

// .env 파일 로드
dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USERNAME || 'yeirin',
  password: process.env.DB_PASSWORD || 'yeirin123',
  database: process.env.DB_DATABASE || 'yeirin_dev',
  entities: [path.join(__dirname, '../typeorm/entity/*.entity.{ts,js}')],
  synchronize: true,
  ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
});

async function seedVoucherInstitutions() {
  await dataSource.initialize();
  console.log('📊 데이터베이스 연결 성공');

  // 바우처 기관 테이블만 비우기 (다른 테이블 영향 없음)
  await dataSource.query(
    'TRUNCATE TABLE b_impact_voucher_institutions, common_voucher_institutions RESTART IDENTITY CASCADE',
  );
  console.log('🗑️  바우처 기관 기존 데이터 삭제 완료');

  // =====================================================
  // 1. B-IMPACT 바우처 기관 시드 데이터 (22개)
  // =====================================================
  console.log('\n🏥 B-IMPACT 바우처 기관 생성 중...');

  const bImpactRepo = dataSource.getRepository('BImpactVoucherInstitutionEntity');
  const savedBImpact = await bImpactRepo.save(bImpactVoucherInstitutionsData);
  console.log(`✅ ${savedBImpact.length}개 B-IMPACT 바우처 기관 생성 완료`);

  const bImpactDistrictStats = savedBImpact.reduce(
    (acc: Record<string, number>, inst: any) => {
      acc[inst.district] = (acc[inst.district] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  console.log('   📊 구/군별 B-IMPACT 기관 수:');
  Object.entries(bImpactDistrictStats).forEach(([district, count]) => {
    console.log(`      - ${district}: ${count}개`);
  });

  // =====================================================
  // 2. 일반 바우처 기관 시드 데이터 (159개)
  // =====================================================
  console.log('\n🏢 일반 바우처 기관 생성 중...');

  const commonRepo = dataSource.getRepository('CommonVoucherInstitutionEntity');
  const savedCommon = await commonRepo.save(commonVoucherInstitutionsData);
  console.log(`✅ ${savedCommon.length}개 일반 바우처 기관 생성 완료`);

  const commonDistrictStats = savedCommon.reduce(
    (acc: Record<string, number>, inst: any) => {
      acc[inst.district] = (acc[inst.district] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  console.log('   📊 구/군별 일반 바우처 기관 수:');
  Object.entries(commonDistrictStats).forEach(([district, count]) => {
    console.log(`      - ${district}: ${count}개`);
  });

  // =====================================================
  // 요약
  // =====================================================
  console.log('\n🎉 바우처 기관 시드 데이터 생성 완료!');
  console.log(`   - B-IMPACT 바우처 기관: ${savedBImpact.length}개`);
  console.log(`   - 일반 바우처 기관: ${savedCommon.length}개`);
  console.log(`   - 총: ${savedBImpact.length + savedCommon.length}개`);

  await dataSource.destroy();
}

seedVoucherInstitutions()
  .then(() => {
    console.log('✅ 바우처 기관 시드 스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 바우처 기관 시드 스크립트 실행 실패:', error);
    process.exit(1);
  });
