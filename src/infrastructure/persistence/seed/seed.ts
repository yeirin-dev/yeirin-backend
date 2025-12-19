import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { CounselorProfileEntity } from '../typeorm/entity/counselor-profile.entity';
import { ServiceType } from '../typeorm/entity/enums/service-type.enum';
import { SpecialTreatment } from '../typeorm/entity/enums/special-treatment.enum';
import { VoucherType } from '../typeorm/entity/enums/voucher-type.enum';
import { ReviewEntity } from '../typeorm/entity/review.entity';
import { UserEntity } from '../typeorm/entity/user.entity';
import { VoucherInstitutionEntity } from '../typeorm/entity/voucher-institution.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5433,
  username: 'yeirin',
  password: 'yeirin123',
  database: 'yeirin_dev',
  entities: [path.join(__dirname, '../typeorm/entity/*.entity.{ts,js}')],
  synchronize: false,
});

async function seed() {
  await dataSource.initialize();
  console.log('📊 데이터베이스 연결 성공');

  const institutionRepo = dataSource.getRepository(VoucherInstitutionEntity);
  const counselorRepo = dataSource.getRepository(CounselorProfileEntity);
  const reviewRepo = dataSource.getRepository(ReviewEntity);
  const userRepo = dataSource.getRepository(UserEntity);

  // 기존 데이터 삭제 (외래 키 제약 고려)
  await dataSource.query(
    'TRUNCATE TABLE reviews, counselor_profiles, voucher_institutions RESTART IDENTITY CASCADE',
  );
  console.log('🗑️  기존 데이터 삭제 완료');

  // =====================================================
  // Admin 사용자 생성 (기존 Admin 계정이 없는 경우에만)
  // =====================================================
  console.log('\n👑 Admin 사용자 확인 중...');

  const existingAdmin = await userRepo.findOne({
    where: { email: 'admin@yeirin.co.kr' },
  });

  if (!existingAdmin) {
    // 비밀번호: Admin@123! (영문, 숫자, 특수문자 포함)
    const adminPassword = await bcrypt.hash('Admin@123!', 10);

    const adminUser = userRepo.create({
      email: 'admin@yeirin.co.kr',
      password: adminPassword,
      realName: '시스템관리자',
      phoneNumber: '010-0000-0000',
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
      isBanned: false,
    });

    await userRepo.save(adminUser);
    console.log('✅ Admin 계정 생성 완료');
    console.log('   📧 이메일: admin@yeirin.co.kr');
    console.log('   🔑 비밀번호: Admin@123!');
  } else {
    console.log('ℹ️  Admin 계정이 이미 존재합니다');
  }

  // =====================================================
  // 기관 대표 (INSTITUTION_ADMIN) 사용자 생성
  // =====================================================
  console.log('\n🏢 기관 대표 사용자 생성 중...');

  const institutionPassword = await bcrypt.hash('Institution@123!', 10);

  const institutionAdminData = [
    { email: 'seoul-center@yeirin.co.kr', realName: '김미영', phoneNumber: '010-1111-1111' },
    { email: 'happy-child@yeirin.co.kr', realName: '이지은', phoneNumber: '010-2222-2222' },
    { email: 'open-heart@yeirin.co.kr', realName: '박준호', phoneNumber: '010-3333-3333' },
    { email: 'kids-mind@yeirin.co.kr', realName: '정수진', phoneNumber: '010-4444-4444' },
    { email: 'bright-child@yeirin.co.kr', realName: '최영희', phoneNumber: '010-5555-5555' },
  ];

  const savedInstitutionAdmins: UserEntity[] = [];
  for (const adminData of institutionAdminData) {
    const existingUser = await userRepo.findOne({ where: { email: adminData.email } });
    if (existingUser) {
      savedInstitutionAdmins.push(existingUser);
    } else {
      const newUser = userRepo.create({
        ...adminData,
        password: institutionPassword,
        role: 'INSTITUTION_ADMIN',
        isActive: true,
        isEmailVerified: true,
        isBanned: false,
      });
      const saved = await userRepo.save(newUser);
      savedInstitutionAdmins.push(saved);
    }
  }
  console.log(`✅ ${savedInstitutionAdmins.length}명 기관 대표 생성 완료`);

  // 바우처 기관 더미 데이터 (userId 연결)
  const institutions = [
    {
      userId: savedInstitutionAdmins[0].id,
      centerName: '서울아동심리상담센터',
      representativeName: '김미영',
      address: '서울특별시 강남구 테헤란로 123',
      establishedDate: new Date('2018-03-15'),
      operatingVouchers: [VoucherType.CHILD_PSYCHOLOGY, VoucherType.DEVELOPMENTAL_REHABILITATION],
      isQualityCertified: true,
      maxCapacity: 30,
      introduction: 'ADHD 및 정서문제 전문 상담센터, 10년 경력 상담사 다수 보유',
      counselorCount: 5,
      counselorCertifications: ['임상심리사 1급', '청소년상담사 2급', '놀이치료사'],
      primaryTargetGroup: 'ADHD',
      secondaryTargetGroup: '정서불안',
      canProvideComprehensiveTest: true,
      providedServices: [ServiceType.COUNSELING, ServiceType.PLAY_THERAPY, ServiceType.ART_THERAPY],
      specialTreatments: [SpecialTreatment.DEVELOPMENTAL_REHABILITATION],
      canProvideParentCounseling: true,
    },
    {
      userId: savedInstitutionAdmins[1].id,
      centerName: '행복한아이 발달센터',
      representativeName: '이지은',
      address: '서울특별시 송파구 올림픽로 456',
      establishedDate: new Date('2020-06-01'),
      operatingVouchers: [
        VoucherType.LANGUAGE_DEVELOPMENT,
        VoucherType.DEVELOPMENTAL_REHABILITATION,
      ],
      isQualityCertified: true,
      maxCapacity: 25,
      introduction: '언어발달 및 발달장애 전문, 가족 상담 병행 가능',
      counselorCount: 4,
      counselorCertifications: ['언어재활사 1급', '작업치료사', '임상심리사 2급'],
      primaryTargetGroup: '언어발달지연',
      secondaryTargetGroup: '발달장애',
      canProvideComprehensiveTest: true,
      providedServices: [
        ServiceType.COUNSELING,
        ServiceType.SENSORY_INTEGRATION,
        ServiceType.COGNITIVE_THERAPY,
      ],
      specialTreatments: [SpecialTreatment.LANGUAGE, SpecialTreatment.DEVELOPMENTAL_REHABILITATION],
      canProvideParentCounseling: true,
    },
    {
      userId: savedInstitutionAdmins[2].id,
      centerName: '마음여는 아동상담소',
      representativeName: '박준호',
      address: '경기도 성남시 분당구 정자로 789',
      establishedDate: new Date('2017-09-20'),
      operatingVouchers: [VoucherType.CHILD_PSYCHOLOGY, VoucherType.PARENT_COUNSELING],
      isQualityCertified: false,
      maxCapacity: 20,
      introduction: '불안장애 및 우울증 전문, 부모 상담 특화',
      counselorCount: 3,
      counselorCertifications: ['임상심리사 1급', '전문상담사 1급'],
      primaryTargetGroup: '불안장애',
      secondaryTargetGroup: '우울증',
      canProvideComprehensiveTest: false,
      providedServices: [ServiceType.COUNSELING, ServiceType.MUSIC_THERAPY],
      specialTreatments: [SpecialTreatment.NONE],
      canProvideParentCounseling: true,
    },
    {
      userId: savedInstitutionAdmins[3].id,
      centerName: '키즈마인드 종합심리센터',
      representativeName: '정수진',
      address: '인천광역시 부평구 부평대로 321',
      establishedDate: new Date('2019-11-10'),
      operatingVouchers: [
        VoucherType.CHILD_PSYCHOLOGY,
        VoucherType.DEVELOPMENTAL_REHABILITATION,
        VoucherType.LANGUAGE_DEVELOPMENT,
      ],
      isQualityCertified: true,
      maxCapacity: 40,
      introduction: '종합심리검사 가능, 다양한 치료 프로그램 운영',
      counselorCount: 7,
      counselorCertifications: ['임상심리사 1급', '놀이치료사', '미술치료사', '언어재활사 2급'],
      primaryTargetGroup: '종합심리검사',
      secondaryTargetGroup: undefined,
      canProvideComprehensiveTest: true,
      providedServices: [
        ServiceType.COUNSELING,
        ServiceType.PLAY_THERAPY,
        ServiceType.ART_THERAPY,
        ServiceType.MUSIC_THERAPY,
        ServiceType.COGNITIVE_THERAPY,
      ],
      specialTreatments: [SpecialTreatment.LANGUAGE, SpecialTreatment.DEVELOPMENTAL_REHABILITATION],
      canProvideParentCounseling: true,
    },
    {
      userId: savedInstitutionAdmins[4].id,
      centerName: '해맑은 아동발달클리닉',
      representativeName: '최영희',
      address: '대전광역시 유성구 대학로 111',
      establishedDate: new Date('2021-02-14'),
      operatingVouchers: [VoucherType.DEVELOPMENTAL_REHABILITATION],
      isQualityCertified: false,
      maxCapacity: 15,
      introduction: '감각통합치료 전문, 소수정예 맞춤 케어',
      counselorCount: 2,
      counselorCertifications: ['작업치료사', '감각통합치료사'],
      primaryTargetGroup: '감각통합장애',
      secondaryTargetGroup: '자폐스펙트럼',
      canProvideComprehensiveTest: false,
      providedServices: [ServiceType.SENSORY_INTEGRATION, ServiceType.PLAY_THERAPY],
      specialTreatments: [SpecialTreatment.DEVELOPMENTAL_REHABILITATION, SpecialTreatment.OTHER],
      canProvideParentCounseling: false,
    },
  ];

  console.log('🏢 바우처 기관 생성 중...');
  const savedInstitutions = await institutionRepo.save(institutions);
  console.log(`✅ ${savedInstitutions.length}개 기관 생성 완료`);

  // =====================================================
  // 상담사 (COUNSELOR) 사용자 생성
  // =====================================================
  console.log('\n👨‍⚕️ 상담사 사용자 생성 중...');

  const counselorPassword = await bcrypt.hash('Counselor@123!', 10);

  const counselorUserData = [
    // 서울아동심리상담센터 상담사들
    { email: 'counselor-kimjw@yeirin.co.kr', realName: '김지원', phoneNumber: '010-1001-1001' },
    { email: 'counselor-parksy@yeirin.co.kr', realName: '박서연', phoneNumber: '010-1001-1002' },
    // 행복한아이 발달센터 상담사들
    { email: 'counselor-leemj@yeirin.co.kr', realName: '이민주', phoneNumber: '010-1002-1001' },
    { email: 'counselor-junghw@yeirin.co.kr', realName: '정현우', phoneNumber: '010-1002-1002' },
    // 마음여는 아동상담소 상담사들
    { email: 'counselor-kangej@yeirin.co.kr', realName: '강은지', phoneNumber: '010-1003-1001' },
    // 키즈마인드 종합심리센터 상담사들
    { email: 'counselor-yoonjh@yeirin.co.kr', realName: '윤지혜', phoneNumber: '010-1004-1001' },
    { email: 'counselor-hansh@yeirin.co.kr', realName: '한승현', phoneNumber: '010-1004-1002' },
    // 해맑은 아동발달클리닉 상담사들
    { email: 'counselor-joym@yeirin.co.kr', realName: '조영민', phoneNumber: '010-1005-1001' },
  ];

  const savedCounselorUsers: UserEntity[] = [];
  for (const userData of counselorUserData) {
    const existingUser = await userRepo.findOne({ where: { email: userData.email } });
    if (existingUser) {
      savedCounselorUsers.push(existingUser);
    } else {
      const newUser = userRepo.create({
        ...userData,
        password: counselorPassword,
        role: 'COUNSELOR',
        isActive: true,
        isEmailVerified: true,
        isBanned: false,
      });
      const saved = await userRepo.save(newUser);
      savedCounselorUsers.push(saved);
    }
  }
  console.log(`✅ ${savedCounselorUsers.length}명 상담사 사용자 생성 완료`);

  // 상담사 프로필 더미 데이터 (userId 연결)
  const counselors = [
    // 서울아동심리상담센터 상담사들
    {
      userId: savedCounselorUsers[0].id,
      institutionId: savedInstitutions[0].id,
      name: '김지원',
      experienceYears: 12,
      certifications: ['임상심리사 1급', '놀이치료사', '청소년상담사 1급'],
      specialties: ['ADHD', '주의력결핍', '과잉행동'],
      introduction:
        'ADHD 아동 전문 상담 12년 경력. 놀이치료와 인지행동치료를 병행하여 학교 적응력 향상에 중점을 둡니다.',
    },
    {
      userId: savedCounselorUsers[1].id,
      institutionId: savedInstitutions[0].id,
      name: '박서연',
      experienceYears: 8,
      certifications: ['임상심리사 2급', '미술치료사'],
      specialties: ['정서불안', '미술치료', '표현예술'],
      introduction:
        '정서 불안정 아동 대상 미술치료 전문. 비언어적 표현을 통한 내면 탐색에 강점이 있습니다.',
    },

    // 행복한아이 발달센터 상담사들
    {
      userId: savedCounselorUsers[2].id,
      institutionId: savedInstitutions[1].id,
      name: '이민주',
      experienceYears: 10,
      certifications: ['언어재활사 1급', '발달재활서비스 제공인력'],
      specialties: ['언어발달지연', '조음장애', '유창성장애'],
      introduction:
        '언어발달 전문 10년 경력. 개별 맞춤형 언어 프로그램으로 의사소통 능력 향상에 집중합니다.',
    },
    {
      userId: savedCounselorUsers[3].id,
      institutionId: savedInstitutions[1].id,
      name: '정현우',
      experienceYears: 7,
      certifications: ['작업치료사', '감각통합치료사'],
      specialties: ['감각통합', '발달지연', '소근육운동'],
      introduction: '감각통합치료 및 작업치료 전문. 발달 전반에 걸친 통합적 접근을 시도합니다.',
    },

    // 마음여는 아동상담소 상담사들
    {
      userId: savedCounselorUsers[4].id,
      institutionId: savedInstitutions[2].id,
      name: '강은지',
      experienceYears: 15,
      certifications: ['임상심리사 1급', '전문상담사 1급', '인지행동치료사'],
      specialties: ['불안장애', '공황장애', '사회불안'],
      introduction:
        '불안장애 전문 15년 경력. 인지행동치료(CBT)를 통한 체계적인 불안 관리 프로그램을 제공합니다.',
    },

    // 키즈마인드 종합심리센터 상담사들
    {
      userId: savedCounselorUsers[5].id,
      institutionId: savedInstitutions[3].id,
      name: '윤지혜',
      experienceYears: 11,
      certifications: ['임상심리사 1급', '종합심리평가 전문'],
      specialties: ['종합심리검사', '지능검사', '정서검사'],
      introduction: '종합심리검사 전문. 정확한 진단을 통해 개별 맞춤형 치료 계획을 수립합니다.',
    },
    {
      userId: savedCounselorUsers[6].id,
      institutionId: savedInstitutions[3].id,
      name: '한승현',
      experienceYears: 9,
      certifications: ['놀이치료사', '모래놀이치료사'],
      specialties: ['놀이치료', '모래놀이', '애착형성'],
      introduction: '놀이치료 전문. 아이의 놀이 세계를 통해 정서적 안정과 성장을 돕습니다.',
    },

    // 해맑은 아동발달클리닉 상담사들
    {
      userId: savedCounselorUsers[7].id,
      institutionId: savedInstitutions[4].id,
      name: '조영민',
      experienceYears: 6,
      certifications: ['작업치료사', '감각통합치료사', '발달재활서비스 제공인력'],
      specialties: ['감각통합', '자폐스펙트럼', '발달지연'],
      introduction:
        '감각통합치료 전문. 소수정예로 집중적인 개별 케어를 통해 일상생활 적응력을 높입니다.',
    },
  ];

  console.log('📋 상담사 프로필 생성 중...');
  const savedCounselors = await counselorRepo.save(counselors);
  console.log(`✅ ${savedCounselors.length}명 상담사 생성 완료`);

  // 리뷰 더미 데이터
  const reviews = [
    // 서울아동심리상담센터 리뷰
    {
      institutionId: savedInstitutions[0].id,
      userId: undefined,
      authorNickname: '행복한엄마',
      rating: 5,
      content:
        'ADHD 아이를 둔 부모입니다. 김지원 선생님의 전문적인 상담으로 아이가 많이 안정되었어요. 학교 선생님도 변화를 느끼신다고 하시네요. 적극 추천합니다!',
      helpfulCount: 12,
    },
    {
      institutionId: savedInstitutions[0].id,
      userId: undefined,
      authorNickname: '감사합니다',
      rating: 5,
      content:
        '상담사 선생님들이 모두 친절하시고 전문적이에요. 아이도 센터 가는 것을 좋아해서 부담없이 치료받고 있습니다.',
      helpfulCount: 8,
    },
    {
      institutionId: savedInstitutions[0].id,
      userId: undefined,
      authorNickname: '초등맘',
      rating: 4,
      content:
        '전문성은 뛰어나지만 예약이 너무 밀려서 대기 시간이 길어요. 그래도 기다릴 가치는 있습니다.',
      helpfulCount: 5,
    },

    // 행복한아이 발달센터 리뷰
    {
      institutionId: savedInstitutions[1].id,
      userId: undefined,
      authorNickname: '언어치료중',
      rating: 5,
      content:
        '말이 늦은 아이 언어치료 받고 있어요. 3개월만에 눈에 띄게 향상되었습니다. 이민주 선생님 감사합니다!',
      helpfulCount: 15,
    },
    {
      institutionId: savedInstitutions[1].id,
      userId: undefined,
      authorNickname: '발달센터추천',
      rating: 5,
      content:
        '언어치료와 감각통합치료를 함께 받을 수 있어서 좋아요. 선생님들도 아이를 진심으로 대해주시는 게 느껴집니다.',
      helpfulCount: 10,
    },

    // 마음여는 아동상담소 리뷰
    {
      institutionId: savedInstitutions[2].id,
      userId: undefined,
      authorNickname: '불안맘',
      rating: 5,
      content:
        '불안증이 심한 아이 때문에 여러 곳을 다녀봤는데, 여기가 제일 좋았어요. 강은지 선생님의 CBT 프로그램이 효과적입니다.',
      helpfulCount: 9,
    },
    {
      institutionId: savedInstitutions[2].id,
      userId: undefined,
      authorNickname: '부모상담도',
      rating: 4,
      content: '아이 상담뿐 아니라 부모 상담도 병행해서 가족 전체가 건강해지는 느낌이에요.',
      helpfulCount: 6,
    },

    // 키즈마인드 종합심리센터 리뷰
    {
      institutionId: savedInstitutions[3].id,
      userId: undefined,
      authorNickname: '종합검사후기',
      rating: 5,
      content:
        '종합심리검사를 정확하게 해주셔서 아이의 문제를 명확히 알 수 있었어요. 이후 맞춤 치료 계획도 체계적이었습니다.',
      helpfulCount: 18,
    },
    {
      institutionId: savedInstitutions[3].id,
      userId: undefined,
      authorNickname: '놀이치료추천',
      rating: 5,
      content: '한승현 선생님의 놀이치료 정말 좋아요. 아이가 센터 가는 걸 너무 좋아합니다.',
      helpfulCount: 11,
    },
    {
      institutionId: savedInstitutions[3].id,
      userId: undefined,
      authorNickname: '시설좋음',
      rating: 4,
      content: '시설이 깨끗하고 프로그램이 다양해요. 다만 인기가 많아서 예약이 어렵습니다.',
      helpfulCount: 7,
    },

    // 해맑은 아동발달클리닉 리뷰
    {
      institutionId: savedInstitutions[4].id,
      userId: undefined,
      authorNickname: '감각통합치료',
      rating: 5,
      content:
        '소수정예라 선생님이 우리 아이에게 집중해주셔서 좋아요. 감각통합 전문성이 뛰어납니다.',
      helpfulCount: 8,
    },
    {
      institutionId: savedInstitutions[4].id,
      userId: undefined,
      authorNickname: '자폐아동부모',
      rating: 4,
      content: '자폐 아이에게 도움이 많이 되고 있어요. 규모는 작지만 전문성과 정성은 최고입니다.',
      helpfulCount: 6,
    },
  ];

  console.log('⭐ 리뷰 생성 중...');
  const savedReviews = await reviewRepo.save(reviews as any[]);
  console.log(`✅ ${savedReviews.length}개 리뷰 생성 완료`);

  // 평균 별점 및 리뷰 개수 업데이트
  for (const institution of savedInstitutions) {
    const institutionReviews = savedReviews.filter(
      (r: ReviewEntity) => r.institutionId === institution.id,
    );
    if (institutionReviews.length > 0) {
      const avgRating =
        institutionReviews.reduce((sum: number, r: ReviewEntity) => sum + r.rating, 0) /
        institutionReviews.length;
      await institutionRepo.update(institution.id, {
        averageRating: Number(avgRating.toFixed(2)),
        reviewCount: institutionReviews.length,
        counselorCount: savedCounselors.filter((c) => c.institutionId === institution.id).length,
      });
    }
  }
  console.log('✅ 기관 통계 정보 업데이트 완료');

  console.log('\n🎉 더미 데이터 시드 완료!');
  console.log(`   - 바우처 기관: ${savedInstitutions.length}개`);
  console.log(`   - 상담사 프로필: ${savedCounselors.length}명`);
  console.log(`   - 리뷰: ${savedReviews.length}개`);

  await dataSource.destroy();
}

seed()
  .then(() => {
    console.log('✅ 시드 스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 시드 스크립트 실행 실패:', error);
    process.exit(1);
  });
