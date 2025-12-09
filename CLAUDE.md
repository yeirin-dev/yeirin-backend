# Yeirin Main Backend

NestJS 기반 메인 백엔드 서비스

## 기술 스택

| 구분 | 기술 |
|------|------|
| Framework | NestJS 11 |
| Language | TypeScript 5.1 |
| ORM | TypeORM 0.3 (Entity 자동 동기화) |
| Database | PostgreSQL 15 |
| Auth | JWT + Passport + bcrypt |
| Storage | AWS S3 / MinIO |
| Docs | Swagger |

## 패키지 매니저

```bash
# ⚠️ 반드시 Yarn 사용 (npm 금지)
yarn install
yarn start:dev
yarn test
yarn build
```

## 아키텍처 (DDD)

```
src/
├── domain/           # 순수 비즈니스 로직 (프레임워크 독립)
├── application/      # Use Cases (서비스 계층)
├── infrastructure/   # 기술 구현체 (TypeORM, Auth, S3)
└── presentation/     # API 컨트롤러
```

### 계층 의존성 규칙

```
Domain → Application → Infrastructure → Presentation
(역방향 의존 금지)
```

## 도메인 목록

| 도메인 | 설명 |
|--------|------|
| user | 회원 (4개 역할) |
| guardian | 보호자 프로필 |
| child | 아동 관리 |
| counsel-request | 상담의뢰지 |
| counsel-report | 면담결과지 |
| counselor | 상담사 프로필 |
| institution | 바우처 기관 |
| matching | AI 추천 연동 |

### 사용자 역할

```typescript
enum UserRole {
  GUARDIAN = 'GUARDIAN',           // 보호자 (교사/부모)
  INSTITUTION_ADMIN = 'INSTITUTION_ADMIN',  // 기관 관리자
  COUNSELOR = 'COUNSELOR',         // 상담사
  ADMIN = 'ADMIN',                 // 시스템 관리자
}
```

## 핵심 패턴

### Result 타입

```typescript
// 예외 대신 Result 사용 (Railway-Oriented Programming)
const result = Email.create('user@example.com');
if (result.isFailure) {
  return Result.fail(result.error);
}
const email = result.value;
```

### Value Object

```typescript
// 원시값 포장 필수
email: Email           // ❌ string
password: Password     // ❌ string
role: UserRole         // ❌ 'GUARDIAN' | 'ADMIN'
```

### Repository 네이밍

```typescript
// Domain Layer (인터페이스)
export interface UserRepository { }

// Infrastructure Layer (구현체)
export class UserRepositoryImpl implements UserRepository { }

// DI 등록
{ provide: 'UserRepository', useClass: UserRepositoryImpl }
```

### Import 경로

```typescript
// ✅ 절대경로 사용
import { User } from '@domain/user/model/user';
import { AuthService } from '@application/auth/auth.service';

// ❌ 상대경로 금지
import { User } from '../../../domain/user/model/user';
```

## 주요 명령어

```bash
yarn start:dev    # 개발 서버 (watch mode)
yarn build        # 프로덕션 빌드
yarn test         # 테스트 실행
yarn test:cov     # 커버리지
yarn lint         # ESLint
yarn seed         # 시드 데이터
```

## 테스트 규칙

```typescript
describe('Email Value Object', () => {
  it('올바른 이메일 형식이면 Email을 생성한다', () => {
    // Given
    const validEmail = 'user@example.com';

    // When
    const result = Email.create(validEmail);

    // Then
    expect(result.isSuccess).toBe(true);
  });
});
```

## MSA 연동

### yeirin-ai 호출

```typescript
// 상담기관 추천 요청
POST http://localhost:8001/api/v1/recommendations
Header: X-Internal-Secret: ${INTERNAL_API_SECRET}
Body: { counsel_request_text: "..." }
```

### soul-e Webhook 수신

```typescript
// 상담의뢰지 생성 Webhook
POST /api/v1/webhook/counsel-request
Header: X-Webhook-Secret: ${YEIRIN_WEBHOOK_SECRET}
```

## 환경 변수 (.env.example)

```bash
# Database
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=yeirin
DB_PASSWORD=yeirin123
DB_DATABASE=yeirin_dev

# JWT
JWT_SECRET=your-secret
JWT_ACCESS_TOKEN_EXPIRATION=7d

# S3 (로컬: MinIO)
AWS_S3_ENDPOINT=http://localhost:9000
AWS_S3_FORCE_PATH_STYLE=true
AWS_S3_BUCKET_NAME=yeirin-counsel-requests

# MSA
AI_RECOMMENDATION_SERVICE_URL=http://localhost:8001
INTERNAL_API_SECRET=yeirin-internal-secret
```

## 절대 규칙

1. Domain 계층에 `@Injectable`, `@Entity` 데코레이터 금지
2. `any` 타입 금지 → `unknown` 사용
3. 테스트 이름 한글로 작성
4. Result 타입으로 에러 처리
5. Value Object로 원시값 포장
