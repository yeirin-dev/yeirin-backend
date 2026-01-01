import * as path from 'path';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { CommunityChildCenterEntity } from '../typeorm/entity/community-child-center.entity';
import { CounselorProfileEntity } from '../typeorm/entity/counselor-profile.entity';
import { ServiceType } from '../typeorm/entity/enums/service-type.enum';
import { SpecialTreatment } from '../typeorm/entity/enums/special-treatment.enum';
import { VoucherType } from '../typeorm/entity/enums/voucher-type.enum';
import { ReviewEntity } from '../typeorm/entity/review.entity';
import { UserEntity } from '../typeorm/entity/user.entity';
import { VoucherInstitutionEntity } from '../typeorm/entity/voucher-institution.entity';

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
  synchronize: false,
});

async function seed() {
  await dataSource.initialize();
  console.log('📊 데이터베이스 연결 성공');

  const institutionRepo = dataSource.getRepository(VoucherInstitutionEntity);
  const counselorRepo = dataSource.getRepository(CounselorProfileEntity);
  const reviewRepo = dataSource.getRepository(ReviewEntity);
  const userRepo = dataSource.getRepository(UserEntity);
  const communityChildCenterRepo = dataSource.getRepository(CommunityChildCenterEntity);

  // 기존 데이터 삭제 (외래 키 제약 고려)
  await dataSource.query(
    'TRUNCATE TABLE reviews, counselor_profiles, voucher_institutions, community_child_centers, child_profiles, care_facilities RESTART IDENTITY CASCADE',
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
  // 지역아동센터 시드 데이터 (73개 센터)
  // =====================================================
  console.log('\n🏫 지역아동센터 생성 중...');

  // 시설 기본 비밀번호: "1234" (bcrypt 해시)
  const facilityPassword = await bcrypt.hash('1234', 10);

  // 지역아동센터 데이터 (엑셀에서 추출)
  const communityChildCenters = [
    // =====================================================
    // 원도심권 - 영도구 (10개)
    // =====================================================
    { name: '옹달샘', district: '영도구', region: '원도심권', address: '부산시 영도구 동삼로59번길 14, 2층', directorName: '김윤희', managerName: '김윤희', managerPhone: '010-9090-8130', phoneNumber: '051-405-0713', email: 'ongdalsaem-2005@hanmail.net', expectedChildCount: 10 },
    { name: '영도중앙', district: '영도구', region: '원도심권', address: '부산시 영도구 대교로50, 3층', directorName: '김영희', managerName: '김영희', managerPhone: '010-3911-2797', phoneNumber: '070-7728-3760', email: 'yjc7728@naver.com', expectedChildCount: 10 },
    { name: '영도행복한홈스쿨', district: '영도구', region: '원도심권', address: '부산시 영도구 동삼북로3, 207호(주공1단지상가)', directorName: '이은희', managerName: '이은희', managerPhone: '010-4127-5378', phoneNumber: '051-403-2787', email: 'sweet2783@hanmail.net', expectedChildCount: 10 },
    { name: '바울', district: '영도구', region: '원도심권', address: '부산시 영도구 해님2길3, 3층', directorName: '백경자', managerName: '백경자', managerPhone: '010-3551-0501', phoneNumber: '051-414-0966', email: 'bawui1912@naver.com', expectedChildCount: 12 },
    { name: '와치', district: '영도구', region: '원도심권', address: '부산시 영도구 함지로79번길 76', directorName: '정혜윤', managerName: '정혜윤', managerPhone: '010-4797-3796', phoneNumber: '051-403-4200', email: 'wachi@nkwelfare.kr', expectedChildCount: 10 },
    { name: '임마누엘', district: '영도구', region: '원도심권', address: '부산시 영도구 태종로704, 상가동2층201호', directorName: '최선미', managerName: '최선미', managerPhone: '010-4175-2142', phoneNumber: '051-554-8750', email: 'immanueljisen@naver.com', expectedChildCount: 10 },
    { name: '동삼', district: '영도구', region: '원도심권', address: '부산시 영도구 태종로 797', directorName: '서정미', managerName: '김현정', managerPhone: '010-9575-9887', phoneNumber: '051-403-5535', email: 'p757300@daum.net', expectedChildCount: 10 },
    { name: '영도원광', district: '영도구', region: '원도심권', address: '부산시 영도구 남도여중길 28', directorName: '천인숙', managerName: '천인숙', managerPhone: '010-3009-4458', phoneNumber: '070-7011-9549', email: 'gesun71@hanmail.net', expectedChildCount: 10 },
    { name: '다정', district: '영도구', region: '원도심권', address: '부산시 영도구 도래샘길80', directorName: '좌은아', managerName: '좌은아', managerPhone: '010-9231-9625', phoneNumber: '051-417-6664', email: 'lovellll7@hanmail.net', expectedChildCount: 8 },
    { name: '꿈꾸는상리', district: '영도구', region: '원도심권', address: '부산시 영도구 상리로 33. 4층 (동삼동)', directorName: '유미숙', managerName: '유미숙', managerPhone: '010-5199-0867', phoneNumber: '070-7798-0867', email: 'dscwc0101@naver.com', expectedChildCount: 12 },

    // =====================================================
    // 서부산권 - 북구 (13개)
    // =====================================================
    { name: '1318미래세대지역아동센터', district: '북구', region: '서부산권', address: '부산시 북구 만덕대로 65번길 63, 2층', directorName: '문동민', managerName: '문동민', managerPhone: '010-6764-4008', phoneNumber: '051-341-4008', email: 'mr1318@daum.net', expectedChildCount: 2 },
    { name: '샘물지역아동센터', district: '북구', region: '서부산권', address: '부산시 북구 화명대로 94번길 14 2층', directorName: '전미순', managerName: '전미순', managerPhone: '010-6787-5984', phoneNumber: '051-337-3856', email: 'pak.9712@hanmail.net', expectedChildCount: 4 },
    { name: '반딧불이지역아동센터', district: '북구', region: '서부산권', address: '부산시 북구 금곡대로 616번길 10-9', directorName: '김혜진', managerName: '김혜진', managerPhone: '010-4946-5949', phoneNumber: '051-710-5517', email: 'ymcabd20@hanmail.net', expectedChildCount: 5 },
    { name: '온누리지역아동센터', district: '북구', region: '서부산권', address: '부산시 북구 의성로78번길 15-1, 1층', directorName: '안순영', managerName: '문희은', managerPhone: '010-6764-1876', phoneNumber: '051-343-4008', email: 'ahnsy40@daum.net', expectedChildCount: 20 },
    { name: '꿈터지역아동센터', district: '북구', region: '서부산권', address: '부산시 북구 시랑로 103 2층', directorName: '김외득', managerName: '한수정', managerPhone: '010-8306-3295', phoneNumber: '051-343-1426', email: 'kimoiduk@naver.com', expectedChildCount: 1 },
    { name: '해오름지역아동센터', district: '북구', region: '서부산권', address: '부산시 북구 시랑로 122 2층', directorName: '이나경', managerName: '이나경', managerPhone: '010-6261-4950', phoneNumber: '051-336-2267', email: 'bom2267@daum.net', expectedChildCount: 8 },
    { name: '구남지역아동센터', district: '북구', region: '서부산권', address: '부산시 북구 구남언덕로21,3층', directorName: '김희주', managerName: '어주영', managerPhone: '010-4601-5688', phoneNumber: '070-41629002', email: 'kunamkids@naver.com', expectedChildCount: 5 },
    { name: '낙동지역아동센터', district: '북구', region: '서부산권', address: '부산시 북구 백양대로 1127 2층', directorName: '문숙희', managerName: '문숙희', managerPhone: '010-2401-5450', phoneNumber: '051-333-1848', email: 'msh3138@hanmail.net', expectedChildCount: 3 },
    { name: '덕천지역아동센터', district: '북구', region: '서부산권', address: '부산시 북구 모분재로15번길75 한라상가2층', directorName: '정은교', managerName: '정은교', managerPhone: '010-2311-4223', phoneNumber: '051-337-4223', email: 'dnflemf486@naver.com', expectedChildCount: 2 },
    { name: '늘해랑지역아동센터', district: '북구', region: '서부산권', address: '부산시 북구 모분재로120번길 20, 2층', directorName: '박경령', managerName: '박경령', managerPhone: '010-4154-1467', phoneNumber: '051-900-7303', email: 'nhr5858@naver.com', expectedChildCount: 10 },
    { name: '리틀스쿨지역아동센터', district: '북구', region: '서부산권', address: '부산시 북구 산성로 76-8번지 2층', directorName: '이창송', managerName: '이창송', managerPhone: '010-7356-6658', phoneNumber: '051-331-8763', email: 'lcslcs66@empal.com', expectedChildCount: 28 },
    { name: '라온지역아동센터', district: '북구', region: '서부산권', address: '부산시 북구 시랑로21번길 44 2층', directorName: '서숙희', managerName: '서숙희', managerPhone: '010-9795-3669', phoneNumber: '051-338-0924', email: 'crc924@naver.com', expectedChildCount: 5 },

    // =====================================================
    // 서부산권 - 사상구 (12개)
    // =====================================================
    { name: '사상해오름', district: '사상구', region: '서부산권', address: '부산시 사상구 새벽시장로56번가길41 2층', directorName: '정혜인', managerName: '주은지', managerPhone: '010-9764-2007', phoneNumber: '051-328-5995', email: 'pjk6581@naver.com', expectedChildCount: 2 },
    { name: '덕포영재', district: '사상구', region: '서부산권', address: '부산광역시 사상구 백양대로 766(덕포동)', directorName: '이은숙', managerName: '최현옥', managerPhone: '010-2261-3504', phoneNumber: '051-302-6036', email: 'sseo778@naver.com', expectedChildCount: 2 },
    { name: '부산꿈', district: '사상구', region: '서부산권', address: '부산시 사상구 대동로 110-13 부산유치원 1층', directorName: '김진숙', managerName: '장수민', managerPhone: '010-4934-7987', phoneNumber: '070-8800-8849', email: 'bckyd@naver.com', expectedChildCount: 2 },
    { name: '희망', district: '사상구', region: '서부산권', address: '사상구 사상로275 3층.덕포동', directorName: '김진아', managerName: '박미심', managerPhone: '010-2593-3744', phoneNumber: '051-304-5098', email: 'greenhope2015@naver.com', expectedChildCount: 2 },
    { name: '백양', district: '사상구', region: '서부산권', address: '부산시 사상구 모라로192번길 20-33', directorName: '고미화', managerName: '조인희', managerPhone: '010-8193-9122', phoneNumber: '051-711-0077', email: 'byccc0077@naver.com', expectedChildCount: 2 },
    { name: '괘내행복마을', district: '사상구', region: '서부산권', address: '부산시 사상구 백양대로646번나길22', directorName: '장남희', managerName: '심지해', managerPhone: '010-2896-8022', phoneNumber: '051-316-1511', email: 'gwaene15112@hanmail.net', expectedChildCount: 2 },
    { name: '새생명', district: '사상구', region: '서부산권', address: '부산시 사상구 주례로10번길 131 3층', directorName: '정경화', managerName: '오하영', managerPhone: '010-9052-7197', phoneNumber: '051-311-5199', email: 'new2home@naver.com', expectedChildCount: 3 },
    { name: '주례', district: '사상구', region: '서부산권', address: '부산광역시 사상구 가야대로366번길 63-6, 1층', directorName: '권혁남', managerName: '권혁남', managerPhone: '010-8011-6189', phoneNumber: '051-311-1649', email: 'iujy60@hanmail.net', expectedChildCount: 6 },
    { name: '문화', district: '사상구', region: '서부산권', address: '부산광역시 사상구 가야대로366번길 125', directorName: '김민정', managerName: '김은숙', managerPhone: '010-5015-6101', phoneNumber: '051-312-2585', email: 'mh3122585@hanmail.net', expectedChildCount: 2 },
    { name: '사랑의집', district: '사상구', region: '서부산권', address: '부산시 사상구 광장로105번길17 1,2층', directorName: '김경아', managerName: '김혜린', managerPhone: '010-7219-0104', phoneNumber: '051-322-2832', email: 'jesus5646@hanmail.net', expectedChildCount: 1 },
    { name: '디딤돌', district: '사상구', region: '서부산권', address: '부산시 사상구 사상로 310번길 75-5', directorName: '김선희', managerName: '서미옥', managerPhone: '010-2554-0867', phoneNumber: '051-302-1279', email: 'didim130529@gmail.com', expectedChildCount: 4 },
    { name: '학장', district: '사상구', region: '서부산권', address: '부산광역시 사상구 학감대로49번길', directorName: '박일숙', managerName: '박일숙', managerPhone: '010-6639-9083', phoneNumber: '051-311-4014', email: 'hakjang4014@naver.com', expectedChildCount: 3 },

    // =====================================================
    // 중부산권 - 부산진구 (11개)
    // =====================================================
    { name: '꿈꾸는', district: '부산진구', region: '중부산권', address: '부산진구 신암로 51-5', directorName: '허세훈', managerName: '이하은', managerPhone: '010-7659-0131', phoneNumber: '051-644-0091', email: 'amf1989@hanmail.net', expectedChildCount: 5 },
    { name: '한울타리', district: '부산진구', region: '중부산권', address: '서전로57번길29', directorName: '이미옥', managerName: '손온유', managerPhone: '010-9811-3284', phoneNumber: '051-805-6036', email: 'hanultari1991@hanmail.net', expectedChildCount: 6 },
    { name: '축복', district: '부산진구', region: '중부산권', address: '당감서로 98번길20-22', directorName: '강명자', managerName: '이정화', managerPhone: '010-6583-2714', phoneNumber: '051-818-4252', email: 'ainsin11@hanmail.net', expectedChildCount: 7 },
    { name: '신애', district: '부산진구', region: '중부산권', address: '부산진구 백양순환로 127번길 8', directorName: '윤가현', managerName: '최윤정', managerPhone: '010-7700-7200', phoneNumber: '051-817-8547', email: 'g8554@hanmail.net', expectedChildCount: 5 },
    { name: '에이스', district: '부산진구', region: '중부산권', address: '부산진구가야대로 703번나길 23', directorName: '김미연', managerName: '강동훈', managerPhone: '010-9927-5454', phoneNumber: '051-897-633', email: 'ooon455@naver.com', expectedChildCount: 5 },
    { name: '개금꿈나무', district: '부산진구', region: '중부산권', address: '부산진구 백양관문로77번길140', directorName: '유청림', managerName: '유청림', managerPhone: '010-2910-6314', phoneNumber: '070-5151-6912', email: 'newsy10099@naver.com', expectedChildCount: 7 },
    { name: '성지', district: '부산진구', region: '중부산권', address: '부산진구 동평로94번길 28', directorName: '최은화', managerName: '이수정', managerPhone: '010-2866-6770', phoneNumber: '051-898-500', email: 'sungji1994@hanmail.net', expectedChildCount: 5 },
    { name: '전포', district: '부산진구', region: '중부산권', address: '진남로 356번길 90.102동 205호', directorName: '강명순', managerName: '강채원', managerPhone: '010-9811-5086', phoneNumber: '051-816-9055', email: '7jjjjjj@naver.com', expectedChildCount: 5 },
    { name: '평강', district: '부산진구', region: '중부산권', address: '중앙대로978', directorName: '김경숙', managerName: '김경숙', managerPhone: '010-5592-5469', phoneNumber: '051-861-3927', email: 'soona0125@hanmail.net', expectedChildCount: 5 },
    { name: '부산진', district: '부산진구', region: '중부산권', address: '부산진구 당감서로 72 3층', directorName: '정숙경', managerName: '정숙경', managerPhone: '010-4548-0877', phoneNumber: '051-893-0160', email: '1207bsj@hanmail.net', expectedChildCount: 5 },
    { name: '남부산', district: '부산진구', region: '중부산권', address: '부산진구 진남로 300 (전포1동)', directorName: '이정애', managerName: '이정애', managerPhone: '010-7941-6869', phoneNumber: '051-806-2205', email: 'dlwjddo42@hanmail.net', expectedChildCount: 5 },

    // =====================================================
    // 중부산권 - 동래구 (14개)
    // =====================================================
    { name: '다원', district: '동래구', region: '중부산권', address: '부산 동래구 아시아드대로 185, 3층', directorName: '최희자', managerName: '최희자', managerPhone: '010-2687-8145', phoneNumber: '070-8807-5877', email: 'hc8145@hanmail.net', expectedChildCount: 2 },
    { name: '우리들', district: '동래구', region: '중부산권', address: '부산 동래구 쇠미로 119번길 36(사직동,2층)', directorName: '김미연', managerName: '김미연', managerPhone: '010-4119-2417', phoneNumber: '051-501-2417', email: 'my2417ok@hanmail.net', expectedChildCount: 2 },
    { name: '동래', district: '동래구', region: '중부산권', address: '부산 동래구 시실로 107번길 151, 3층(동래종합사회복지관)', directorName: '김혜영', managerName: '김혜영', managerPhone: '010-6450-1576', phoneNumber: '070-8897-8859', email: 'hlog_d01056@naver.com', expectedChildCount: 4 },
    { name: '푸른', district: '동래구', region: '중부산권', address: '부산 동래구 반송로 215(안락동)', directorName: '김봉선', managerName: '김봉선', managerPhone: '010-5680-3449', phoneNumber: '051-528-1925', email: 'purun1925@hanmail.net', expectedChildCount: 3 },
    { name: '안락', district: '동래구', region: '중부산권', address: '부산 동래구 안락동 명안로 39번길 65(안락동,2층)', directorName: '신영미', managerName: '신영미', managerPhone: '010-9774-0692', phoneNumber: '051-524-8155', email: 'sym8713@naver.com', expectedChildCount: 2 },
    { name: '온천제일', district: '동래구', region: '중부산권', address: '부산 동래구 금강로 19(온천동,4층)', directorName: '신미섭', managerName: '신미섭', managerPhone: '010-4556-5268', phoneNumber: '051-557-9008', email: 'ofc5579008@naver.com', expectedChildCount: 5 },
    { name: '수안빛', district: '동래구', region: '중부산권', address: '부산 동래구 충렬대로 238번가길 49-5 202호(낙민동,아델리아)', directorName: '김남석', managerName: '김남석', managerPhone: '010-8027-7222', phoneNumber: '070-8232-7221', email: 'kns60777@naver.com', expectedChildCount: 4 },
    { name: '명륜', district: '동래구', region: '중부산권', address: '부산 동래구 명륜로 210 승일빌딩 3층(명륜동)', directorName: '배정임', managerName: '배정임', managerPhone: '010-5508-5388', phoneNumber: '051-553-8279', email: '8279mr@daum.net', expectedChildCount: 3 },
    { name: '아이나라', district: '동래구', region: '중부산권', address: '부산 동래구 명안로 71번길 5(명장동,2층)', directorName: '이정미', managerName: '이정미', managerPhone: '010-5003-5249', phoneNumber: '051-527-9393', email: 'yi4266@naver.com', expectedChildCount: 2 },
    { name: '화목', district: '동래구', region: '중부산권', address: '부산 동래구 명안로 26번길 47(안락동,3층)', directorName: '서경미', managerName: '서경미', managerPhone: '010-5960-0591', phoneNumber: '051-507-9182', email: 'ggaeng66@hanmail.net', expectedChildCount: 5 },
    { name: '현대재능', district: '동래구', region: '중부산권', address: '부산 동래구 중앙대로 1267번길 57(사직동)', directorName: '이정미', managerName: '이정미', managerPhone: '010-2832-8469', phoneNumber: '070-8841-8499', email: 'center8385@hanmail.net', expectedChildCount: 1 },
    { name: '보금자리', district: '동래구', region: '중부산권', address: '부산 동래구 사직북로50번길 49(사직동,2층)', directorName: '김미숙', managerName: '김미숙', managerPhone: '010-2848-9253', phoneNumber: '051-507-1206', email: '1925jr@hanmail.net', expectedChildCount: 5 },
    { name: '동래튼튼이', district: '동래구', region: '중부산권', address: '부산 동래구 중앙대로 1333번길 46-1(온천동,1층)', directorName: '김양희', managerName: '김양희', managerPhone: '010-2885-8947', phoneNumber: '051-555-7032', email: 'holg_t02565@naver.com', expectedChildCount: 2 },
    { name: '동래숲', district: '동래구', region: '중부산권', address: '부산 동래구 시실로 24번길 10, 동양빌딩4층', directorName: '김순옥', managerName: '김순옥', managerPhone: '010-4871-3329', phoneNumber: '051-866-3329', email: 'soop3329@hanmail.net', expectedChildCount: 3 },

    // =====================================================
    // 동부산권 - 해운대구 (13개)
    // =====================================================
    { name: '반여지역아동센터', district: '해운대구', region: '동부산권', address: '부산시 해운대구 선수촌로 21번길 21.그린종합상가 2층. 52호', directorName: '양순희', managerName: '윤은숙', managerPhone: '010-4566-9543', phoneNumber: '051-523-5509', email: 'banyeo5509@hanmail.net', expectedChildCount: 5 },
    { name: '나눔터지역아동센터', district: '해운대구', region: '동부산권', address: '부산시 해운대구 달맞이길 239-11,202호', directorName: '문영숙', managerName: '문영숙', managerPhone: '010-3976-7172', phoneNumber: '051-746-9107', email: 'nanumt9107@naver.com', expectedChildCount: 3 },
    { name: '즐거운지역아동센터', district: '해운대구', region: '동부산권', address: '부산광역시 해운대구 재송2로74번길 36(재송동) 2층 즐거운지역아동센터', directorName: '임영미', managerName: '김정숙', managerPhone: '010-2053-3374', phoneNumber: '051-782-7776', email: 'jbsmile3033@naver.com', expectedChildCount: 3 },
    { name: '좌동지역아동센터', district: '해운대구', region: '동부산권', address: '부산광역시 해운대구 대천로67번길 12, 상가 404호', directorName: '백윤실', managerName: '이인숙', managerPhone: '010-2055-5549', phoneNumber: '051-746-3389', email: 'adongcenter@naver.com', expectedChildCount: 4 },
    { name: '미리내지역아동센터', district: '해운대구', region: '동부산권', address: '부산시 해운대구 아랫반송로 21번길 94-9', directorName: '이외숙', managerName: '송은영', managerPhone: '010-4885-4771', phoneNumber: '051-545-2915', email: 'mirinea@kakao.com', expectedChildCount: 14 },
    { name: 'LH행복꿈터 해운대지역아동센터', district: '해운대구', region: '동부산권', address: '부산 해운대구 재반로 12번길 16(재송동)', directorName: '이미정', managerName: '김성인', managerPhone: '010-2889-1810', phoneNumber: '051-724-5105', email: 'hud2005@naver.com', expectedChildCount: 6 },
    { name: '하늘가람', district: '해운대구', region: '동부산권', address: '부산시 해운대구 재반로85. 4층', directorName: '이경애', managerName: '최주현', managerPhone: '051-783-1118', phoneNumber: '051-783-1118', email: 'dlruddo2768@hanmail.net', expectedChildCount: 10 },
    { name: '희망스쿨지역아동센터', district: '해운대구', region: '동부산권', address: '부산시 해운대구 아랫반송로 29번길 25, 29 3~4층', directorName: '최슬아', managerName: '노혜미', managerPhone: '010-6213-0538', phoneNumber: '051-542-3332', email: 'busanhpeschool@daum.net', expectedChildCount: 20 },
    { name: '가람뫼', district: '해운대구', region: '동부산권', address: '부산광역시 해운대구 재반로 226번길 72 현대일성아파트 상가동 3층', directorName: '박경자', managerName: '박경자', managerPhone: '010-4383-0488', phoneNumber: '051-784-0488', email: 'bkjsm486@naver.com', expectedChildCount: 6 },
    { name: '1318해피존꿈앤꿈지역아동센터', district: '해운대구', region: '동부산권', address: '부산광역시 해운대구 신반송로 138-2 대성빌라 302호', directorName: '김경덕', managerName: '정윤희', managerPhone: '010-3118-6306', phoneNumber: '051-542-1813', email: 'dreamer1813@hanmail.net', expectedChildCount: 20 },
    { name: '해봄지역아동센터', district: '해운대구', region: '동부산권', address: '해운대구 신반송로200, 주공아파트 나동상가 2층', directorName: '권채련', managerName: '성시현', managerPhone: '051-542-1391', phoneNumber: '051-542-1391', email: 'haebom98@hanmail.net', expectedChildCount: 10 },
    { name: '반송지역아동센터', district: '해운대구', region: '동부산권', address: '부산광역시 해운대구 윗반송로 51번길 48-13', directorName: '이지현', managerName: '이지현', managerPhone: '010-4562-5059', phoneNumber: '051-545-3335', email: 'bansong66@hanmail.net', expectedChildCount: 5 },
    { name: '예선지역아동센터', district: '해운대구', region: '동부산권', address: '부산시 해운대구 우동2로 48 3층', directorName: '조영희', managerName: '박지은', managerPhone: '010-6579-0311', phoneNumber: '051-746-9100', email: 'jyh5055@naver.com', expectedChildCount: 19 },
  ];

  // 지역아동센터 데이터 저장
  const centersToSave = communityChildCenters.map((center) => ({
    ...center,
    password: facilityPassword,
    isPasswordChanged: false,
    isActive: true,
  }));

  const savedCenters = await communityChildCenterRepo.save(centersToSave);
  console.log(`✅ ${savedCenters.length}개 지역아동센터 생성 완료`);

  // 구/군별 통계 출력
  const districtStats = savedCenters.reduce(
    (acc, center) => {
      acc[center.district] = (acc[center.district] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  console.log('   📊 구/군별 센터 수:');
  Object.entries(districtStats).forEach(([district, count]) => {
    console.log(`      - ${district}: ${count}개`);
  });

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
  console.log(`   - 지역아동센터: ${savedCenters.length}개`);
  console.log(`   - 바우처 기관: ${savedInstitutions.length}개`);
  console.log(`   - 상담사 프로필: ${savedCounselors.length}명`);
  console.log(`   - 리뷰: ${savedReviews.length}개`);
  console.log('\n📋 지역아동센터 로그인 정보:');
  console.log('   🔑 초기 비밀번호: 1234 (첫 로그인 시 변경 필요)');

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
