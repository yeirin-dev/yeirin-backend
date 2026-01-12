import * as path from 'path';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { CommunityChildCenterEntity } from '../typeorm/entity/community-child-center.entity';
import { CareFacilityEntity } from '../typeorm/entity/care-facility.entity';
import { EducationWelfareSchoolEntity } from '../typeorm/entity/education-welfare-school.entity';

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
  ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
});

async function seed() {
  await dataSource.initialize();
  console.log('📊 데이터베이스 연결 성공');

  const communityChildCenterRepo = dataSource.getRepository(CommunityChildCenterEntity);
  const careFacilityRepo = dataSource.getRepository(CareFacilityEntity);
  const educationWelfareSchoolRepo = dataSource.getRepository(EducationWelfareSchoolEntity);

  // 기존 데이터 삭제 (외래 키 제약 고려)
  await dataSource.query(
    'TRUNCATE TABLE reviews, community_child_centers, child_profiles, care_facilities, education_welfare_schools RESTART IDENTITY CASCADE',
  );
  console.log('🗑️  기존 데이터 삭제 완료');

  // 시설 기본 비밀번호: "1234" (bcrypt 해시)
  const facilityPassword = await bcrypt.hash('1234', 10);

  // =====================================================
  // 1. 지역아동센터 시드 데이터 (62개 센터)
  // =====================================================
  console.log('\n🏫 지역아동센터 생성 중...');

  // 지역아동센터 데이터 (참여기관 최종_77기관.xlsx 기반)
  const communityChildCenters = [
    // =====================================================
    // 원도심권 - 영도구 (10개)
    // =====================================================
    {
      name: '옹달샘',
      district: '영도구',
      region: '원도심권',
      address: '부산시 영도구 동삼로59번길 14, 2층',
      directorName: '김윤희',
      managerName: '김윤희',
      managerPhone: '010-9090-8130',
      phoneNumber: '051-405-0713',
      email: 'ongdalsaem-2005@hanmail.net',
      expectedChildCount: 10,
    },
    {
      name: '영도중앙',
      district: '영도구',
      region: '원도심권',
      address: '부산시 영도구 대교로50, 3층',
      directorName: '김영희',
      managerName: '김영희',
      managerPhone: '010-3911-2797',
      phoneNumber: '070-7728-3760',
      email: 'yjc7728@naver.com',
      expectedChildCount: 10,
    },
    {
      name: '영도행복한홈스쿨',
      district: '영도구',
      region: '원도심권',
      address: '부산시 영도구 동삼북로3, 207호(주공1단지상가)',
      directorName: '이은희',
      managerName: '이은희',
      managerPhone: '010-4127-5378',
      phoneNumber: '051-403-2787',
      email: 'sweet2783@hanmail.net',
      expectedChildCount: 10,
    },
    {
      name: '바울',
      district: '영도구',
      region: '원도심권',
      address: '부산시 영도구 해님2길3, 3층',
      directorName: '백경자',
      managerName: '백경자',
      managerPhone: '010-3551-0501',
      phoneNumber: '051-414-0966',
      email: 'bawui1912@naver.com',
      expectedChildCount: 12,
    },
    {
      name: '와치',
      district: '영도구',
      region: '원도심권',
      address: '부산시 영도구 함지로79번길 76',
      directorName: '정혜윤',
      managerName: '정혜윤',
      managerPhone: '010-4797-3796',
      phoneNumber: '051-403-4200',
      email: 'wachi@nkwelfare.kr',
      expectedChildCount: 10,
    },
    {
      name: '임마누엘',
      district: '영도구',
      region: '원도심권',
      address: '부산시 영도구 태종로704, 상가동2층201호',
      directorName: '최선미',
      managerName: '최선미',
      managerPhone: '010-4175-2142',
      phoneNumber: '051-554-8750',
      email: 'immanueljisen@naver.com',
      expectedChildCount: 10,
    },
    {
      name: '동삼',
      district: '영도구',
      region: '원도심권',
      address: '부산시 영도구 태종로 797',
      directorName: '서정미',
      managerName: '김현정',
      managerPhone: '010-9575-9887',
      phoneNumber: '051-403-5535',
      email: 'p757300@daum.net',
      expectedChildCount: 10,
    },
    {
      name: '영도원광',
      district: '영도구',
      region: '원도심권',
      address: '부산시 영도구 남도여중길 28',
      directorName: '천인숙',
      managerName: '천인숙',
      managerPhone: '010-3009-4458',
      phoneNumber: '070-7011-9549',
      email: 'gesun71@hanmail.net',
      expectedChildCount: 10,
    },
    {
      name: '다정',
      district: '영도구',
      region: '원도심권',
      address: '부산시 영도구 도래샘길80',
      directorName: '좌은아',
      managerName: '좌은아',
      managerPhone: '010-9231-9625',
      phoneNumber: '051-417-6664',
      email: 'lovellll7@hanmail.net',
      expectedChildCount: 8,
    },
    {
      name: '꿈꾸는상리',
      district: '영도구',
      region: '원도심권',
      address: '부산시 영도구 상리로 33. 4층 (동삼동)',
      directorName: '유미숙',
      managerName: '유미숙',
      managerPhone: '010-5199-0867',
      phoneNumber: '070-7798-0867',
      email: 'dscwc0101@naver.com',
      expectedChildCount: 12,
    },

    // =====================================================
    // 서부산권 - 북구 (11개)
    // =====================================================
    {
      name: '1318미래세대지역아동센터',
      district: '북구',
      region: '서부산권',
      address: '부산시 북구 만덕대로 65번길 63, 2층',
      directorName: '문동민',
      managerName: '이혜규',
      managerPhone: '010-3901-5847',
      phoneNumber: '051-341-4008',
      email: 'mr1318@daum.net',
      expectedChildCount: 2,
    },
    {
      name: '샘물지역아동센터',
      district: '북구',
      region: '서부산권',
      address: '부산시 북구 화명대로 94번길 14 2층',
      directorName: '전미순',
      managerName: '전미순',
      managerPhone: '010-6787-5984',
      phoneNumber: '051-337-3856',
      email: 'pak.9712@hanmail.net',
      expectedChildCount: 4,
    },
    {
      name: '반딧불이지역아동센터',
      district: '북구',
      region: '서부산권',
      address: '부산시 북구 금곡대로 616번길 10-9',
      directorName: '김혜진',
      managerName: '김혜진',
      managerPhone: '010-4946-5949',
      phoneNumber: '051-710-5517',
      email: 'ymcabd20@hanmail.net',
      expectedChildCount: 5,
    },
    {
      name: '온누리지역아동센터',
      district: '북구',
      region: '서부산권',
      address: '부산시 북구 의성로78번길 15-1, 1층',
      directorName: '안순영',
      managerName: '문희은',
      managerPhone: '010-6764-1876',
      phoneNumber: '051-343-4008',
      email: 'ahnsy40@daum.net',
      expectedChildCount: 20,
    },
    {
      name: '꿈터지역아동센터',
      district: '북구',
      region: '서부산권',
      address: '부산시 북구 시랑로 103 2층',
      directorName: '김외득',
      managerName: '한수정',
      managerPhone: '010-8306-3295',
      phoneNumber: '051-343-1426',
      email: 'kimoiduk@naver.com',
      expectedChildCount: 1,
    },
    {
      name: '해오름지역아동센터',
      district: '북구',
      region: '서부산권',
      address: '부산시 북구 시랑로 122 2층',
      directorName: '이나경',
      managerName: '이나경',
      managerPhone: '010-6261-4950',
      phoneNumber: '051-336-2267',
      email: 'bom2267@daum.net',
      expectedChildCount: 8,
    },
    {
      name: '구남지역아동센터',
      district: '북구',
      region: '서부산권',
      address: '부산시 북구 구남언덕로21,3층',
      directorName: '김희주',
      managerName: '어주영',
      managerPhone: '010-4601-5688',
      phoneNumber: '070-41629002',
      email: 'kunamkids@naver.com',
      expectedChildCount: 5,
    },
    {
      name: '낙동지역아동센터',
      district: '북구',
      region: '서부산권',
      address: '부산시 북구 백양대로 1127 2층',
      directorName: '문숙희',
      managerName: '문숙희',
      managerPhone: '010-2401-5450',
      phoneNumber: '051-333-1848',
      email: 'msh3138@hanmail.net',
      expectedChildCount: 3,
    },
    {
      name: '덕천지역아동센터',
      district: '북구',
      region: '서부산권',
      address: '부산시 북구 모분재로15번길75 한라상가2층',
      directorName: '정은교',
      managerName: '정은교',
      managerPhone: '010-2311-4223',
      phoneNumber: '051-337-4223',
      email: 'dnflemf486@naver.com',
      expectedChildCount: 2,
    },
    {
      name: '리틀스쿨지역아동센터',
      district: '북구',
      region: '서부산권',
      address: '부산시 북구 산성로 76-8번지 2층',
      directorName: '이창송',
      managerName: '이창송',
      managerPhone: '010-7356-6658',
      phoneNumber: '051-331-8763',
      email: 'lcslcs66@empal.com',
      expectedChildCount: 28,
    },
    {
      name: '라온지역아동센터',
      district: '북구',
      region: '서부산권',
      address: '부산시 북구 시랑로21번길 44 2층',
      directorName: '서숙희',
      managerName: '서숙희',
      managerPhone: '010-9795-3669',
      phoneNumber: '051-338-0924',
      email: 'crc924@naver.com',
      expectedChildCount: 5,
    },

    // =====================================================
    // 서부산권 - 사상구 (10개)
    // =====================================================
    {
      name: '사상해오름',
      district: '사상구',
      region: '서부산권',
      address: '부산시 사상구 새벽시장로56번가길41 2층',
      directorName: '정혜인',
      managerName: '주은지',
      managerPhone: '010-9764-2007',
      phoneNumber: '051-328-5995',
      email: 'pjk6581@naver.com',
      expectedChildCount: 2,
    },
    {
      name: '덕포영재',
      district: '사상구',
      region: '서부산권',
      address: '부산광역시 사상구 백양대로 766(덕포동)',
      directorName: '이은숙',
      managerName: '최현옥',
      managerPhone: '010-2261-3504',
      phoneNumber: '051-302-6036',
      email: 'sseo778@naver.com',
      expectedChildCount: 2,
    },
    {
      name: '부산꿈',
      district: '사상구',
      region: '서부산권',
      address: '부산시 사상구 대동로 110-13 부산유치원 1층',
      directorName: '김진숙',
      managerName: '장수민',
      managerPhone: '010-4934-7987',
      phoneNumber: '070-8800-8849',
      email: 'bckyd@naver.com',
      expectedChildCount: 2,
    },
    {
      name: '희망',
      district: '사상구',
      region: '서부산권',
      address: '사상구 사상로275 3층.덕포동',
      directorName: '김진아',
      managerName: '박미심',
      managerPhone: '010-2593-3744',
      phoneNumber: '051-304-5098',
      email: 'greenhope2015@naver.com',
      expectedChildCount: 2,
    },
    {
      name: '백양',
      district: '사상구',
      region: '서부산권',
      address: '부산시 사상구 모라로192번길 20-33',
      directorName: '고미화',
      managerName: '조인희',
      managerPhone: '010-8193-9122',
      phoneNumber: '051-711-0077',
      email: 'byccc0077@naver.com',
      expectedChildCount: 2,
    },
    {
      name: '괘내행복마을',
      district: '사상구',
      region: '서부산권',
      address: '부산시 사상구 백양대로646번나길22',
      directorName: '장남희',
      managerName: '심지해',
      managerPhone: '010-2896-8022',
      phoneNumber: '051-316-1511',
      email: 'gwaene15112@hanmail.net',
      expectedChildCount: 2,
    },
    {
      name: '주례',
      district: '사상구',
      region: '서부산권',
      address: '부산광역시 사상구 가야대로366번길 63-6, 1층',
      directorName: '권혁남',
      managerName: '권혁남',
      managerPhone: '010-8011-6189',
      phoneNumber: '051-311-1649',
      email: 'iujy60@hanmail.net',
      expectedChildCount: 6,
    },
    {
      name: '문화',
      district: '사상구',
      region: '서부산권',
      address: '부산광역시 사상구 가야대로366번길 125',
      directorName: '김민정',
      managerName: '김은숙',
      managerPhone: '010-5015-6101',
      phoneNumber: '051-312-2585',
      email: 'mh3122585@hanmail.net',
      expectedChildCount: 2,
    },
    {
      name: '디딤돌',
      district: '사상구',
      region: '서부산권',
      address: '부산시 사상구 사상로 310번길 75-5',
      directorName: '김선희',
      managerName: '서미옥',
      managerPhone: '010-2554-0867',
      phoneNumber: '051-302-1279',
      email: 'didim130529@gmail.com',
      expectedChildCount: 4,
    },
    {
      name: '학장',
      district: '사상구',
      region: '서부산권',
      address: '부산광역시 사상구 학감대로49번길',
      directorName: '박일숙',
      managerName: '박일숙',
      managerPhone: '010-6639-9083',
      phoneNumber: '051-311-4014',
      email: 'hakjang4014@naver.com',
      expectedChildCount: 3,
    },

    // =====================================================
    // 중부산권 - 부산진구 (9개)
    // =====================================================
    {
      name: '꿈꾸는',
      district: '부산진구',
      region: '중부산권',
      address: '부산진구 신암로 51-5',
      directorName: '허세훈',
      managerName: '이하은',
      managerPhone: '010-7659-0131',
      phoneNumber: '051-644-0091',
      email: 'amf1989@hanmail.net',
      expectedChildCount: 5,
    },
    {
      name: '한울타리',
      district: '부산진구',
      region: '중부산권',
      address: '서전로57번길29',
      directorName: '이미옥',
      managerName: '손온유',
      managerPhone: '010-9811-3284',
      phoneNumber: '051-805-6036',
      email: 'hanultari1991@hanmail.net',
      expectedChildCount: 6,
    },
    {
      name: '신애',
      district: '부산진구',
      region: '중부산권',
      address: '부산진구 백양순환로 127번길 8',
      directorName: '윤가현',
      managerName: '최윤정',
      managerPhone: '010-7700-7200',
      phoneNumber: '051-817-8547',
      email: 'g8554@hanmail.net',
      expectedChildCount: 5,
    },
    {
      name: '개금꿈나무',
      district: '부산진구',
      region: '중부산권',
      address: '부산진구 백양관문로77번길140',
      directorName: '유청림',
      managerName: '유청림',
      managerPhone: '010-2910-6314',
      phoneNumber: '070-5151-6912',
      email: 'newsy10099@naver.com',
      expectedChildCount: 7,
    },
    {
      name: '성지',
      district: '부산진구',
      region: '중부산권',
      address: '부산진구 동평로94번길 28',
      directorName: '최은화',
      managerName: '이수정',
      managerPhone: '010-8762-5006',
      phoneNumber: '051-898-500',
      email: 'sungji1994@hanmail.net',
      expectedChildCount: 5,
    },
    {
      name: '전포',
      district: '부산진구',
      region: '중부산권',
      address: '진남로 356번길 90.102동 205호',
      directorName: '강명순',
      managerName: '강채원',
      managerPhone: '010-9811-5086',
      phoneNumber: '051-816-9055',
      email: '7jjjjjj@naver.com',
      expectedChildCount: 5,
    },
    {
      name: '평강',
      district: '부산진구',
      region: '중부산권',
      address: '중앙대로978',
      directorName: '김경숙',
      managerName: '김경숙',
      managerPhone: '010-5592-5469',
      phoneNumber: '051-861-3927',
      email: 'soona0125@hanmail.net',
      expectedChildCount: 5,
    },
    {
      name: '부산진',
      district: '부산진구',
      region: '중부산권',
      address: '부산진구 당감서로 72 3층',
      directorName: '정숙경',
      managerName: '정숙경',
      managerPhone: '010-4548-0877',
      phoneNumber: '051-893-0160',
      email: '1207bsj@hanmail.net',
      expectedChildCount: 5,
    },
    {
      name: '남부산',
      district: '부산진구',
      region: '중부산권',
      address: '부산진구 진남로 300 (전포1동)',
      directorName: '이정애',
      managerName: '이정애',
      managerPhone: '010-7941-6869',
      phoneNumber: '051-806-2205',
      email: 'dlwjddo42@hanmail.net',
      expectedChildCount: 5,
    },

    // =====================================================
    // 중부산권 - 동래구 (14개)
    // =====================================================
    {
      name: '다원',
      district: '동래구',
      region: '중부산권',
      address: '부산 동래구 아시아드대로 185, 3층',
      directorName: '최희자',
      managerName: '최희자',
      managerPhone: '010-2687-8145',
      phoneNumber: '070-8807-5877',
      email: 'hc8145@hanmail.net',
      expectedChildCount: 2,
    },
    {
      name: '우리들',
      district: '동래구',
      region: '중부산권',
      address: '부산 동래구 쇠미로 119번길 36(사직동,2층)',
      directorName: '김미연',
      managerName: '김미연',
      managerPhone: '010-4119-2417',
      phoneNumber: '051-501-2417',
      email: 'my2417ok@hanmail.net',
      expectedChildCount: 2,
    },
    {
      name: '동래',
      district: '동래구',
      region: '중부산권',
      address: '부산 동래구 시실로 107번길 151, 3층(동래종합사회복지관)',
      directorName: '김혜영',
      managerName: '김혜영',
      managerPhone: '010-6450-1576',
      phoneNumber: '070-8897-8859',
      email: 'hlog_d01056@naver.com',
      expectedChildCount: 4,
    },
    {
      name: '푸른',
      district: '동래구',
      region: '중부산권',
      address: '부산 동래구 반송로 215(안락동)',
      directorName: '김봉선',
      managerName: '김봉선',
      managerPhone: '010-5680-3449',
      phoneNumber: '051-528-1925',
      email: 'purun1925@hanmail.net',
      expectedChildCount: 3,
    },
    {
      name: '안락',
      district: '동래구',
      region: '중부산권',
      address: '부산 동래구 안락동 명안로 39번길 65(안락동,2층)',
      directorName: '신영미',
      managerName: '신영미',
      managerPhone: '010-8182-7755',
      phoneNumber: '051-524-8155',
      email: 'sym8713@naver.com',
      expectedChildCount: 2,
    },
    {
      name: '온천제일',
      district: '동래구',
      region: '중부산권',
      address: '부산 동래구 금강로 19(온천동,4층)',
      directorName: '신미섭',
      managerName: '신미섭',
      managerPhone: '010-4556-5268',
      phoneNumber: '051-557-9008',
      email: 'ofc5579008@naver.com',
      expectedChildCount: 5,
    },
    {
      name: '수안빛',
      district: '동래구',
      region: '중부산권',
      address: '부산 동래구 충렬대로 238번가길 49-5 202호(낙민동,아델리아)',
      directorName: '김남석',
      managerName: '김남석',
      managerPhone: '010-8027-7222',
      phoneNumber: '070-8232-7221',
      email: 'kns60777@naver.com',
      expectedChildCount: 4,
    },
    {
      name: '명륜',
      district: '동래구',
      region: '중부산권',
      address: '부산 동래구 명륜로 210 승일빌딩 3층(명륜동)',
      directorName: '배정임',
      managerName: '배정임',
      managerPhone: '010-5508-5388',
      phoneNumber: '051-553-8279',
      email: '8279mr@daum.net',
      expectedChildCount: 3,
    },
    {
      name: '아이나라',
      district: '동래구',
      region: '중부산권',
      address: '부산 동래구 명안로 71번길 5(명장동,2층)',
      directorName: '이정미',
      managerName: '이정미',
      managerPhone: '010-5003-5249',
      phoneNumber: '051-527-9393',
      email: 'yi4266@naver.com',
      expectedChildCount: 2,
    },
    {
      name: '화목',
      district: '동래구',
      region: '중부산권',
      address: '부산 동래구 명안로 26번길 47(안락동,3층)',
      directorName: '서경미',
      managerName: '서경미',
      managerPhone: '010-5960-0591',
      phoneNumber: '051-507-9182',
      email: 'ggaeng66@hanmail.net',
      expectedChildCount: 5,
    },
    {
      name: '현대재능',
      district: '동래구',
      region: '중부산권',
      address: '부산 동래구 중앙대로 1267번길 57(사직동)',
      directorName: '이정미',
      managerName: '이정미',
      managerPhone: '010-2832-8469',
      phoneNumber: '070-8841-8499',
      email: 'center8385@hanmail.net',
      expectedChildCount: 1,
    },
    {
      name: '보금자리',
      district: '동래구',
      region: '중부산권',
      address: '부산 동래구 사직북로50번길 49(사직동,2층)',
      directorName: '김미숙',
      managerName: '김미숙',
      managerPhone: '010-2848-9253',
      phoneNumber: '051-507-1206',
      email: '1925jr@hanmail.net',
      expectedChildCount: 5,
    },
    {
      name: '동래튼튼이',
      district: '동래구',
      region: '중부산권',
      address: '부산 동래구 중앙대로 1333번길 46-1(온천동,1층)',
      directorName: '김양희',
      managerName: '김양희',
      managerPhone: '010-2885-8947',
      phoneNumber: '051-555-7032',
      email: 'holg_t02565@naver.com',
      expectedChildCount: 2,
    },
    {
      name: '동래숲',
      district: '동래구',
      region: '중부산권',
      address: '부산 동래구 시실로 24번길 10, 동양빌딩4층',
      directorName: '김순옥',
      managerName: '김순옥',
      managerPhone: '010-4871-3329',
      phoneNumber: '051-866-3329',
      email: 'soop3329@hanmail.net',
      expectedChildCount: 3,
    },

    // =====================================================
    // 동부산권 - 해운대구 (8개)
    // =====================================================
    {
      name: '반여지역아동센터',
      district: '해운대구',
      region: '동부산권',
      address: '부산시 해운대구 선수촌로 21번길 21.그린종합상가 2층. 52호',
      directorName: '양순희',
      managerName: '윤은숙',
      managerPhone: '010-4566-9543',
      phoneNumber: '051-523-5509',
      email: 'banyeo5509@hanmail.net',
      expectedChildCount: 5,
    },
    {
      name: '나눔터지역아동센터',
      district: '해운대구',
      region: '동부산권',
      address: '부산시 해운대구 달맞이길 239-11,202호',
      directorName: '문영숙',
      managerName: '문영숙',
      managerPhone: '010-3976-7172',
      phoneNumber: '051-746-9107',
      email: 'nanumt9107@naver.com',
      expectedChildCount: 3,
    },
    {
      name: '즐거운지역아동센터',
      district: '해운대구',
      region: '동부산권',
      address: '부산광역시 해운대구 재송2로74번길 36(재송동) 2층 즐거운지역아동센터',
      directorName: '임영미',
      managerName: '김정숙',
      managerPhone: '010-2053-3374',
      phoneNumber: '051-782-7776',
      email: 'jbsmile3033@naver.com',
      expectedChildCount: 3,
    },
    {
      name: '좌동지역아동센터',
      district: '해운대구',
      region: '동부산권',
      address: '부산광역시 해운대구 대천로67번길 12, 상가 404호',
      directorName: '백윤실',
      managerName: '이인숙',
      managerPhone: '010-2055-5549',
      phoneNumber: '051-746-3389',
      email: 'adongcenter@naver.com',
      expectedChildCount: 4,
    },
    {
      name: '미리내지역아동센터',
      district: '해운대구',
      region: '동부산권',
      address: '부산시 해운대구 아랫반송로 21번길 94-9',
      directorName: '이외숙',
      managerName: '송은영',
      managerPhone: '010-4885-4771',
      phoneNumber: '051-545-2915',
      email: 'mirinea@kakao.com',
      expectedChildCount: 14,
    },
    {
      name: '하늘가람',
      district: '해운대구',
      region: '동부산권',
      address: '부산시 해운대구 재반로85. 4층',
      directorName: '이경애',
      managerName: '최주현',
      managerPhone: '010-2574-8807',
      phoneNumber: '051-783-1118',
      email: 'dlruddo2768@hanmail.net',
      expectedChildCount: 10,
    },
    {
      name: '가람뫼',
      district: '해운대구',
      region: '동부산권',
      address: '부산광역시 해운대구 재반로 226번길 72 현대일성아파트 상가동 3층',
      directorName: '박경자',
      managerName: '박경자',
      managerPhone: '010-4383-0488',
      phoneNumber: '051-784-0488',
      email: 'bkjsm486@naver.com',
      expectedChildCount: 6,
    },
    {
      name: '1318해피존꿈앤꾼지역아동센터',
      district: '해운대구',
      region: '동부산권',
      address: '부산광역시 해운대구 신반송로 138-2 대성빌라 302호',
      directorName: '김경덕',
      managerName: '정윤희',
      managerPhone: '010-3118-6306',
      phoneNumber: '051-542-1813',
      email: 'dreamer1813@hanmail.net',
      expectedChildCount: 20,
    },
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
  const centerDistrictStats = savedCenters.reduce(
    (acc, center) => {
      acc[center.district] = (acc[center.district] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  console.log('   📊 구/군별 지역아동센터 수:');
  Object.entries(centerDistrictStats).forEach(([district, count]) => {
    console.log(`      - ${district}: ${count}개`);
  });

  // =====================================================
  // 2. 양육시설/그룹홈 시드 데이터 (9개 시설)
  // =====================================================
  console.log('\n🏠 양육시설/그룹홈 생성 중...');

  // 양육시설/그룹홈 데이터
  const careFacilities = [
    // 아동양육시설 (4개)
    {
      name: '파랑새아이들집',
      district: '영도구',
      address: '부산광역시 영도구',
      representativeName: '이지호',
      phoneNumber: '010-9651-5565',
      capacity: 10,
      establishedDate: new Date('2010-01-01'),
    },
    {
      name: '새들원',
      district: '동래구',
      address: '부산광역시 동래구',
      representativeName: '이영숙',
      phoneNumber: '010-5216-5936',
      capacity: 3,
      establishedDate: new Date('2010-01-01'),
    },
    {
      name: '희락원',
      district: '금정구',
      address: '부산광역시 금정구',
      representativeName: '이기라',
      phoneNumber: '010-4825-2862',
      capacity: 2,
      establishedDate: new Date('2010-01-01'),
    },
    {
      name: '새빛기독보육원',
      district: '남구',
      address: '부산광역시 남구',
      representativeName: '최봉자',
      phoneNumber: '010-6528-2256',
      capacity: 3,
      establishedDate: new Date('2010-01-01'),
    },
    // 그룹홈 (5개)
    {
      name: '온새미로',
      district: '남구',
      address: '부산광역시 남구',
      representativeName: '장태순',
      phoneNumber: '010-5624-8934',
      capacity: 1,
      establishedDate: new Date('2010-01-01'),
    },
    {
      name: '이삭나래홈',
      district: '남구',
      address: '부산광역시 남구',
      representativeName: '성숙정',
      phoneNumber: '010-8859-8057',
      capacity: 1,
      establishedDate: new Date('2010-01-01'),
    },
    {
      name: '하늘채그룹홈',
      district: '사하구',
      address: '부산광역시 사하구',
      representativeName: '서금주',
      phoneNumber: '010-6859-1567',
      capacity: 3,
      establishedDate: new Date('2010-01-01'),
    },
    {
      name: '에바다리더홈',
      district: '사상구',
      address: '부산광역시 사상구',
      representativeName: '조진선',
      phoneNumber: '010-3300-4556',
      capacity: 2,
      establishedDate: new Date('2010-01-01'),
    },
    {
      name: '부산해피홈',
      district: '남구',
      address: '부산광역시 남구',
      representativeName: '송지영',
      phoneNumber: '010-6425-5615',
      capacity: 1,
      establishedDate: new Date('2010-01-01'),
    },
  ];

  // 양육시설/그룹홈 데이터 저장
  const facilitiesToSave = careFacilities.map((facility) => ({
    ...facility,
    password: facilityPassword,
    isPasswordChanged: false,
    isActive: true,
  }));

  const savedFacilities = await careFacilityRepo.save(facilitiesToSave);
  console.log(`✅ ${savedFacilities.length}개 양육시설/그룹홈 생성 완료`);

  // 구/군별 통계 출력
  const facilityDistrictStats = savedFacilities.reduce(
    (acc, facility) => {
      acc[facility.district] = (acc[facility.district] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  console.log('   📊 구/군별 양육시설/그룹홈 수:');
  Object.entries(facilityDistrictStats).forEach(([district, count]) => {
    console.log(`      - ${district}: ${count}개`);
  });

  // =====================================================
  // 3. 교육복지사협회 학교 시드 데이터 (6개 학교)
  // =====================================================
  console.log('\n🏫 교육복지사협회 학교 생성 중...');

  // 교육복지사협회 학교 데이터
  const educationWelfareSchools = [
    {
      name: '장림여자중학교',
      district: '사하구',
      address: '부산광역시 사하구 두송로 64',
      welfareWorkerName: '이수정',
      welfareWorkerPhone: '010-5179-1657',
      phoneNumber: '051-260-4284',
      email: 'crystal8708@daum.net',
      expectedChildCount: 1,
      linkedCenterName: '센소리발달센터',
      linkedCenterAddress: '사하구 다송로 71 세인트마린 2층',
    },
    {
      name: '반산초등학교',
      district: '해운대구',
      address: '부산시 해운대구 재반로 171',
      welfareWorkerName: '곽유주',
      welfareWorkerPhone: '010-2844-2388',
      phoneNumber: '051-780-2078',
      email: 'top7775@hanmail.net',
      expectedChildCount: 11,
      linkedCenterName: '다온심리상담센터',
      linkedCenterAddress: '해운대구 재반로256번길 7-30, 402호',
    },
    {
      name: '송도초등학교',
      district: '서구',
      address: '부산광역시 서구 충무대로25',
      welfareWorkerName: '노정혜',
      welfareWorkerPhone: '010-4083-2017',
      phoneNumber: '051-250-5781',
      email: 'nnjh0153@naver.com',
      expectedChildCount: 4,
      linkedCenterName: '해가언어심리상담센터',
      linkedCenterAddress: '서구 구덕로 196, 201호(부민동1가, 허브센티움)',
    },
    {
      name: '용호초등학교',
      district: '남구',
      address: '부산시 남구 용호로 42번길 94',
      welfareWorkerName: '정희숙',
      welfareWorkerPhone: '010-3833-7222',
      phoneNumber: '051-718-2278',
      email: 'gouni28@hanmail.net',
      expectedChildCount: 5,
      linkedCenterName: '강장심리발달연구소',
      linkedCenterAddress: '남구 용호로 42번길 95',
    },
    {
      name: '당감초등학교',
      district: '부산진구',
      address: '부산시 부산진구 당감로 22-5',
      welfareWorkerName: '서혜승',
      welfareWorkerPhone: '010-8573-2007',
      phoneNumber: '070-5023-2528',
      email: 'sseung80@gmail.com',
      expectedChildCount: 5,
      linkedCenterName: '아이꿈언어심리발달센',
      linkedCenterAddress: '부산진구 동평로 82 태을의원 3층',
    },
    {
      name: '금강초등학교',
      district: '동래구',
      address: '부산 동래구 사직북로28번길 125',
      welfareWorkerName: '김지은',
      welfareWorkerPhone: '010-9633-2252',
      phoneNumber: '051-590-0684',
      email: 'dfac003@hanmail.net',
      expectedChildCount: 9,
      linkedCenterName: '이누리심리상담센터',
      linkedCenterAddress: '동래구 사직로14번길 15 2층',
    },
  ];

  // 교육복지사협회 학교 데이터 저장
  const schoolsToSave = educationWelfareSchools.map((school) => ({
    ...school,
    password: facilityPassword,
    isPasswordChanged: false,
    isActive: true,
  }));

  const savedSchools = await educationWelfareSchoolRepo.save(schoolsToSave);
  console.log(`✅ ${savedSchools.length}개 교육복지사협회 학교 생성 완료`);

  // 구/군별 통계 출력
  const schoolDistrictStats = savedSchools.reduce(
    (acc, school) => {
      acc[school.district] = (acc[school.district] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  console.log('   📊 구/군별 교육복지사협회 학교 수:');
  Object.entries(schoolDistrictStats).forEach(([district, count]) => {
    console.log(`      - ${district}: ${count}개`);
  });

  // =====================================================
  // 최종 요약
  // =====================================================
  const totalInstitutions = savedCenters.length + savedFacilities.length + savedSchools.length;
  console.log('\n🎉 시드 데이터 생성 완료!');
  console.log(`   - 지역아동센터: ${savedCenters.length}개`);
  console.log(`   - 양육시설/그룹홈: ${savedFacilities.length}개`);
  console.log(`   - 교육복지사협회 학교: ${savedSchools.length}개`);
  console.log(`   - 총 기관 수: ${totalInstitutions}개`);
  console.log('\n📋 로그인 정보:');
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
