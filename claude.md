# Claude.md - Development Standards

## 🎯 프로젝트 컨텍스트
- **도메인**: 상담기관 매칭 플랫폼
- **아키텍처**: NestJS(메인) + FastAPI(AI/추천) MSA
- **핵심 원칙**: DDD, TDD, Clean Code

### 비즈니스 가치 및 핵심

기존 대한민국 정신적 취약아동 지원사업의 경우 1.보육센터 교사 및 부모의 주기적인 관찰 및 심리검사 직접진행으로 관련 서류 증빙 2.관련 동사무소에서 우선순위 기준에 따라 선별 이후 선별 3. 선별 될 시 카드를 발급. 이후 직접 상담 공급기관 (바우처)에 방문하여 치료 시작 4. 상담 및 치료 과정에서 생긴 보고서 및 각종 서류 모두 직접 수기로 작성 및 전달.

Yeirin(예이린)은 이러한 전체 흐름을 DX하여 데이터화하고, 데이터를 기반으로 취약아동 선별, 바우처 연계를 AI로 진행하고 상담치료과정 중 생긴 보고서의 전산화를 통하여 부모가 양질의 데이터를 기반으로 자녀의 현 상태를 잘 알 수 있도록 하는 가치를 제공.

### 프로젝트 흐름

내 친구  소울이(llm기반 상담심리 챗봇)으로 정신적 취약아동과 대화 이후 (공급기관)상담의뢰지 발송 → 예이린 상담 연계 플랫폼에 전달 → AI 추천 시스템으로 적합한 상담(공급)기관 연계 → (공급기관)에서 지속적인 상담과 동시에 면담결과지 발송 -> 예이린 상담 플랫폼에서 부모에게 전달

## MSA 형태
1. 내친구 소울이 (NextJS + FastAPI) / LLM 기반 심리상담 및 상담의뢰지 자동 생성 서비스
2. 예이린 (NestJS + TypeORM + Postgres) / 전반적인 회원, 데이터 관리 및 중앙 백엔드
3. 예이린 바우처 연계 AI (FastAPI) / 상담의뢰지 - 상담기관 상담의뢰지 기반  상담기관 추천 시스템

## 📋 필수 개발 규칙

### 1. 코드 작성 순공
```
1. 테스트 먼저 작성 (TDD름
2. 도메인 모델 → 유스케이스 → 인프라 순으로 구현
3. 커밋은 기능 단위로 원자적으로
```

### 2. DDD 계층 규칙
```typescript
// 의존성 방향 (절대 역방향 금지)
Domain → Application → Infrastructure → Presentation

// Domain 계층: 외부 의존성 없음
// Application 계층: Domain만 의존
// Infrastructure 계층: Domain, Application 의존
```

### 3. 엔티티/VO 규칙
```typescript
// Entity: ID로 식별, 생애주기 존재
// Value Object: 값으로 식별, 불변
// Aggregate: 트랜잭션 경계, Root만 Repository 보유

// 모든 생성은 정적 팩토리 메서드 사용
Model.create(props) : Result<Model>
```

### 4. 테스트 규칙
```typescript
// 테스트 이름: 한글로 비즈니스 요구사항 명시
it('서류가 모두 검증되면 상담사를 승인한다')

// 구조: Given-When-Then
// 커버리지: 비즈니스 로직 90% 이상
```

### 5. 네이밍 컨벤션
```typescript
// 클래스: PascalCase (명사)
// 메서드: camelCase (동사)
// 불린: is/has/can 접두사
// 이벤트: 과거형 (CounselorApproved)
```

### 6. Repository 네이밍 컨벤션 (필수 준수)
```typescript
// ✅ Domain Layer (인터페이스)
// - I prefix 사용 금지 (TypeScript/NestJS 표준)
// - 도메인 이름 그대로 사용
export interface UserRepository { }
export interface ChildRepository { }
export interface GuardianProfileRepository { }

// ✅ Infrastructure Layer (구현체)
// - Impl suffix 사용 (Google, Netflix, Uber 표준)
// - 프레임워크 독립적 네이밍 (TypeOrm, Mongo 등 기술명 제외)
export class UserRepositoryImpl implements UserRepository { }
export class ChildRepositoryImpl implements ChildRepository { }
export class GuardianProfileRepositoryImpl implements GuardianProfileRepository { }

// ✅ NestJS Module Provider 등록
providers: [
  {
    provide: 'UserRepository',  // 토큰은 인터페이스 이름과 동일
    useClass: UserRepositoryImpl,
  },
]

// ✅ Dependency Injection
constructor(
  @Inject('UserRepository')
  private readonly userRepository: UserRepository,
) {}
```

**네이밍 컨벤션 선택 근거:**
- **업계 표준**: Google, Netflix, Uber 등 빅테크 기업 표준 (`Impl` suffix)
- **TypeScript 철학**: `I` prefix는 Java/C# 레거시, TypeScript에서는 불필요
- **프레임워크 독립성**: TypeOrm, Prisma, Mongo 등 구체적 기술명 제외
- **유연성**: ORM 변경 시에도 클래스명 그대로 유지 가능
- **DDD 원칙**: 도메인 인터페이스가 핵심, 구현체는 세부사항
- **가독성**: import 경로로 도메인/인프라 계층 구분 명확

## 🏗️ 폴더 구조
```
src/
├── domain/[도메인명]/         # 순수 비즈니스
├── application/[유스케이스]/   # 비즈니스 흐름
├── infrastructure/             # 기술 구현체
└── presentation/               # API 계층
```

## ⚠️ 절대 규칙
1. **Domain 계층에 @Injectable, @Entity 등 프레임워크 데코레이터 금지**
2. **any 타입 사용 금지 (unknown 사용)**
3. **매직 넘버/문자열 금지 (상수 추출)**
4. **3개 이상 인자 금지 (객체로 묶기)**
5. **else 최소화 (early return 사용)**

## 🎨 코드 스타일
- 함수: 10줄 이내
- 클래스: 100줄 이내
- 한 파일 한 책임
- 주석보다 의미있는 이름
- 중복보다 잘못된 추상화가 나쁨

### Import 경로 규칙
```typescript
// ✅ 절대경로 사용 (Path Alias)
import { User } from '@domain/user/model/user';
import { UserRepository } from '@domain/user/repository/user.repository';
import { AuthService } from '@application/auth/auth.service';
import { UserEntity } from '@infrastructure/persistence/typeorm/entity/user.entity';
import { AuthController } from '@presentation/auth/auth.controller';

// ❌ 상대경로 사용 금지
import { User } from '../../../domain/user/model/user';
import { User } from './domain/user/model/user';
```

**이유**:
- 코드 가독성 향상 (경로 명확성)
- 파일 이동 시 import 수정 불필요
- IDE 자동완성 향상
- 계층 구조 명확화 (DDD 레이어 시각적 구분)

**자동 적용**: `yarn lint --fix` 실행 시 자동으로 절대경로로 변환

## 💡 AI 어시스턴트 작업 지침
1. **항상 테스트 코드부터 제시**
2. **도메인 모델과 인프라 코드 분리 제시**
3. **Value Object로 원시값 포장 제안**
4. **복잡한 조건문은 도메인 서비스로 추출 제안**
5. **코드 제시 시 항상 실패 케이스 포함**

## 🚀 우선순위
```
1순위: 비즈니스 규칙 정확성
2순위: 테스트 가능성
3순위: 가독성
4순위: 성능
```

# Git 브랜치 & 커밋 컨벤션

## 🌳 Git 브랜치 전략 (GitHub Flow + Release)

### 브랜치 타입
```bash
main          # 프로덕션 (보호됨)
develop       # 개발 통합
feature/*     # 기능 개발
hotfix/*      # 긴급 수정
release/*     # 릴리즈 준비
chore/*       # 설정, 문서
```

### 브랜치 네이밍
```bash
feature/LINEAR-123-add-counselor-matching
hotfix/LINEAR-456-fix-payment-error
release/v1.2.0
chore/update-dependencies
```

## 📝 커밋 컨벤션 (Conventional Commits + Gitmoji)

### 커밋 구조
```
<type>(<scope>): <subject>

<body>

<footer>
```

### 타입별 규칙
```bash
✨ feat:     새로운 기능
🐛 fix:      버그 수정
♻️  refactor: 리팩토링
💄 style:    코드 스타일 (포맷팅, 세미콜론 등)
📝 docs:     문서 수정
✅ test:     테스트 추가/수정
⚡️ perf:     성능 개선
🔧 chore:    빌드, 설정 변경
🚀 deploy:   배포 관련
🔥 remove:   코드/파일 삭제
🚑 hotfix:   긴급 수정
✏️  typo:     오타 수정
🎨 design:   UI/UX 변경
```

### 커밋 예시
```bash
✨ feat(counselor): 상담사 매칭 알고리즘 구현

- 협업 필터링 기반 추천 로직 추가
- 벡터 유사도 계산 모듈 구현
- 매칭 점수 정규화 처리
```

## 🔧 Git 명령어 모음

### 브랜치 작업
```bash
# 피처 브랜치 생성 및 이동
git checkout -b feature/feature-name develop

# 최신 develop 반영 (rebase 사용)
git fetch origin
git rebase origin/develop

# 인터랙티브 리베이스 (커밋 정리)
git rebase -i HEAD~3
```

### 커밋 관리
```bash
# 스테이징 전 변경사항 확인
git diff

# 부분 스테이징
git add -p

# 커밋 메시지 템플릿 사용
git config commit.template .gitmessage

# 마지막 커밋 수정
git commit --amend

# 커밋 서명
git commit -S -m "🐛 fix: 결제 오류 수정"
```

### 스태시 활용
```bash
# 작업 임시 저장
git stash save "WIP: 상담사 매칭 기능"

# 스태시 목록 확인
git stash list

# 특정 스태시 적용
git stash apply stash@{1}

# 스태시 적용 후 삭제
git stash pop
```

### 병합 전략
```bash
# PR 머지 (squash merge 권장)
git checkout develop
git merge --squash feature/matching system
git commit -m "✨ feat: 상담사 매칭 기능 구현 (#123)"

# 충돌 해결
git status
git add <resolved-files>
git rebase --continue
```

### 태그 관리
```bash
# 버전 태그 생성
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin v1.2.0

# 태그 목록 확인
git tag -l "v1.*"
```

### 유용한 설정
```bash
# 글로벌 .gitignore
git config --global core.excludesfile ~/.gitignore_global

# 자동 rebase 설정
git config --global pull.rebase true

# 단축 명령어 (alias)
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.cm commit
git config --global alias.pl pull
git config --global alias.ps push
git config --global alias.lg "log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"

# 커밋 템플릿 설정
git config --global commit.template ~/.gitmessage
```

### 위험 명령어 (주의!)
```bash
# 강제 푸시 (보호된 브랜치 금지)
git push --force-with-lease  # --force보다 안전

# 히스토리 수정
git filter-branch  # 사용 자제, git filter-repo 권장

# 완전 초기화
git clean -fdx  # 추적되지 않는 파일/폴더 모두 삭제
```

## 🚀 PR 규칙
```markdown
## 📋 작업 내용
- [ ] 기능 구현 완료
- [ ] 테스트 작성 완료
- [ ] 문서 업데이트

## 🔗 관련 이슈
- Resolves: #123
- Related: #456

## 📸 스크린샷
(UI 변경 시 필수)

## ✅ 체크리스트
- [ ] 코드 리뷰 요청 전 셀프 리뷰
- [ ] 테스트 모두 통과
- [ ] 브랜치 최신화 완료
```

## 💡 워크플로우 베스트 프랙티스
```bash
# 1. 작업 시작
git checkout develop
git pull origin develop
git checkout -b feature/new-feature

# 2. 작업 중 커밋
git add -p  # 부분 스테이징
git commit -m "✨ feat(scope): 기능 설명"

# 3. 작업 완료 전 정리
git rebase -i HEAD~n  # 커밋 정리
git rebase origin/develop  # 최신화

# 4. PR 생성
git push origin feature/new-feature
# GitHub에서 PR 생성

# 5. 머지 후 정리
git checkout develop
git pull origin develop
git branch -d feature/new-feature
git remote prune origin
```

---
**Remember**: 완벽한 코드보다 지속 가능한 코드. 과도한 추상화 경계.

---

# 📌 REMEMBER - 프로젝트 핵심 컨텍스트

## 🔧 패키지 매니저 & 빌드 도구
```bash
# ⚠️ 절대 규칙: 이 프로젝트는 Yarn 사용!
yarn          # npm 절대 사용 금지
yarn add      # 의존성 추가
yarn add -D   # 개발 의존성 추가
yarn test     # Jest 테스트 실행
yarn build    # NestJS 빌드
```

## 🏗️ 기술 스택 (NestJS 백엔드)

### Core Framework
- **NestJS**: `^11.1.8` - 메인 백엔드 프레임워크
- **TypeScript**: `^5.1.3` - 강타입 언어
- **Node.js**: LTS 버전

### Database & ORM
- **PostgreSQL**: 메인 데이터베이스
- **TypeORM**: `^0.3.17` - ORM (마이그레이션 미사용, Entity 직접 동기화)
- **pg**: `^8.11.3` - PostgreSQL 드라이버

### Authentication & Security
- **JWT**: `@nestjs/jwt ^11.0.1` - 토큰 기반 인증
- **Passport**: `^0.7.0` + `passport-jwt ^4.0.1` - 인증 전략
- **bcrypt**: `^6.0.0` - 비밀번호 해싱
- **helmet**: `^8.1.0` - 보안 헤더

### Testing
- **Jest**: `^29.5.0` - 테스트 러너
- **ts-jest**: `^29.1.0` - TypeScript 지원
- **@nestjs/testing**: `^11.1.8` - NestJS 테스트 유틸

### Validation & Transformation
- **class-validator**: `^0.14.0` - DTO 검증
- **class-transformer**: `^0.5.1` - 객체 변환

### Documentation
- **Swagger**: `@nestjs/swagger ^11.2.1` - API 문서 자동 생성

### Other
- **Winston**: `^3.18.3` + `nest-winston` - 로깅
- **Throttler**: `@nestjs/throttler ^6.4.0` - Rate limiting

## 🗄️ 데이터베이스 구조

### User Roles (4가지)
```typescript
enum UserRole {
  GUARDIAN = 'GUARDIAN',              // 보호자 (교사/부모)
  INSTITUTION_ADMIN = 'INSTITUTION_ADMIN',  // 바우처 공급기관 대표
  COUNSELOR = 'COUNSELOR',            // 상담사
  ADMIN = 'ADMIN',                    // 시스템 관리자
}
```

### 핵심 테이블
- **users**: 회원 (email, password, realName, phoneNumber, role)
- **voucher_institutions**: 바우처 공급기관
- **counselor_profiles**: 상담사 프로필
- **reviews**: 기관 리뷰

## 🏛️ DDD 아키텍처 구조

```
src/
├── domain/                    # 순수 비즈니스 로직 (프레임워크 독립)
│   ├── common/
│   │   ├── result.ts         # Result<T, E> 타입 (Railway-Oriented)
│   │   └── domain-event.ts   # Domain Events, AggregateRoot
│   ├── user/
│   │   ├── model/
│   │   │   ├── user.ts       # User Aggregate Root
│   │   │   └── value-objects/
│   │   │       ├── email.vo.ts
│   │   │       ├── password.vo.ts
│   │   │       ├── user-role.vo.ts
│   │   │       ├── phone-number.vo.ts
│   │   │       └── real-name.vo.ts
│   │   ├── repository/
│   │   │   └── user.repository.ts  # 인터페이스만
│   │   └── events/
│   │       ├── user-registered.event.ts
│   │       └── email-verified.event.ts
│   └── [다른 도메인]/
│
├── application/               # Use Cases (비즈니스 흐름)
│   ├── auth/
│   │   ├── auth.service.ts   # Application Service
│   │   ├── use-cases/
│   │   │   └── register-user/
│   │   │       ├── register-user.use-case.ts
│   │   │       └── register-user.use-case.spec.ts
│   │   └── dto/
│   │       ├── register.dto.ts
│   │       ├── login.dto.ts
│   │       └── auth-response.dto.ts
│   └── [다른 use case]/
│
├── infrastructure/            # 기술 구현체
│   ├── persistence/
│   │   └── typeorm/
│   │       ├── entity/
│   │       │   └── user.entity.ts       # TypeORM Entity
│   │       ├── repository/
│   │       │   └── user.repository.impl.ts  # Repository 구현
│   │       └── mapper/
│   │           └── user.mapper.ts       # Domain ↔ Entity 변환
│   └── auth/
│       ├── strategies/
│       │   └── jwt.strategy.ts
│       ├── guards/
│       │   └── jwt-auth.guard.ts
│       └── decorators/
│           └── public.decorator.ts
│
└── presentation/              # API 계층
    └── auth/
        ├── auth.controller.ts
        └── auth.module.ts
```

## 🎯 핵심 패턴 & 원칙

### 1. Result 타입 (Functional Error Handling)
```typescript
// 성공/실패를 값으로 처리 (예외 던지지 않음)
const result = Email.create('user@example.com');
if (result.isFailure) {
  return Result.fail(result.getError());
}
const email = result.getValue();
```

### 2. Value Objects (원시값 포장)
```typescript
// ❌ 나쁜 예: 원시값 사용
email: string
password: string
role: 'GUARDIAN' | 'ADMIN'

// ✅ 좋은 예: Value Object
email: Email
password: Password
role: UserRole
```

### 3. Aggregate Root (User)
```typescript
// 정적 팩토리 메서드만 사용
User.create(props): Result<User, DomainError>
User.restore(props): User  // DB 복원용

// 비즈니스 로직 캡슐화
user.verifyEmail()
user.changePassword(newPassword)
user.hasPermission('view:own-children')
```

### 4. Mapper Pattern (Anti-Corruption Layer)
```typescript
// Domain ↔ Infrastructure 분리
UserMapper.toDomain(entity): User
UserMapper.toEntity(user): UserEntity
```

## 🧪 테스트 규칙

### Jest 설정
```json
{
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "transformIgnorePatterns": ["node_modules/(?!uuid)"],
  "testEnvironment": "node"
}
```

### 테스트 명령어
```bash
yarn test                           # 전체 테스트
yarn test -- email.vo.spec         # 특정 파일 테스트
yarn test -- --testPathPattern=user.spec
yarn test:watch                     # Watch 모드
yarn test:cov                       # 커버리지 리포트
```

### 테스트 작성 규칙
```typescript
describe('Email Value Object', () => {
  describe('생성', () => {
    it('올바른 이메일 형식이면 Email을 생성한다', () => {
      // Given
      const validEmail = 'user@example.com';

      // When
      const result = Email.create(validEmail);

      // Then
      expect(result.isSuccess).toBe(true);
    });
  });
});
```

## 🚀 자주 사용하는 명령어

```bash
# 개발 서버 실행
yarn start:dev

# 빌드
yarn build

# 테스트
yarn test
yarn test:watch
yarn test:cov

# 린트 & 포맷
yarn lint
yarn format

# Seed 데이터 생성
yarn seed
```

## 🌐 MSA 구성

### 1. 예이린 메인 백엔드 (이 프로젝트)
- **기술**: NestJS + TypeORM + PostgreSQL
- **포트**: 미정 (설정 필요)
- **역할**: 회원 관리, 바우처 기관 관리, 상담사 프로필, 리뷰 등

### 2. 내친구 소울이
- **기술**: NextJS + FastAPI
- **역할**: LLM 기반 심리상담 챗봇, 상담의뢰지 자동 생성

### 3. 바우처 연계 AI
- **기술**: FastAPI
- **역할**: 상담의뢰지 기반 상담기관 추천 시스템

## ⚠️ 절대 잊지 말 것

1. **Yarn 사용** - npm 절대 금지
2. **TDD** - 테스트 먼저 작성
3. **DDD 계층 준수** - Domain → Application → Infrastructure → Presentation
4. **Value Objects** - 원시값 포장 필수
5. **Result 타입** - 예외 대신 Result 사용
6. **한글 테스트 이름** - 비즈니스 요구사항 명시
7. **역할 4가지** - GUARDIAN, INSTITUTION_ADMIN, COUNSELOR, ADMIN
8. **Railway-Oriented Programming** - Functional Error Handling
9. **Mapper 사용** - Domain과 Infrastructure 분리
10. **정적 팩토리 메서드** - `Model.create(props)` 패턴
11. **역할별 1:1 관계** - User ↔ 역할별 Profile (GuardianProfile/VoucherInstitution/CounselorProfile)은 userId로 1:1 CASCADE DELETE 연동
12. **역할별 회원가입** - 트랜잭션으로 User + Profile 원자적 생성, 각 역할별 엔드포인트 분리 (/auth/register/{role})

---

# 📋 프로젝트 개발 체크리스트

## 🎯 프로젝트 흐름별 기능 구현 현황

### 1단계: 상담의뢰지 생성 및 수집
- [x] **소울이 연동**: LLM 챗봇에서 상담의뢰지 자동 생성 (Webhook)
- [x] **보호자 직접 작성**: 보호자가 예이린 플랫폼에서 직접 상담의뢰지 작성
- [x] **파일 첨부**: 이미지 업로드 (검사 결과지 등)
- [ ] **PDF 문서 업로드**: 기존 검사 결과지 PDF 첨부
- [x] **아동 정보 관리**: 보호자가 아동 등록 및 조회

### 2단계: AI 기반 상담기관 매칭
- [x] **AI 추천 요청**: 상담의뢰지 텍스트 기반 상담기관 5곳 추천
- [x] **추천 결과 저장**: CounselRequestRecommendation 엔티티로 추천 이력 관리
- [x] **추천 결과 조회**: 보호자가 추천받은 기관 목록 확인
- [x] **기관 선택**: 보호자가 추천 기관 중 하나 선택 (Accept)
- [x] **매칭 상태 관리**: PENDING → RECOMMENDATION_REQUESTED → MATCHED

### 3단계: 상담 진행 및 관리
- [x] **상담 시작**: 매칭 완료 후 상담 시작 상태 전환
- [x] **상담 완료**: 상담 종료 처리
- [ ] **상담 세션 관리**: 회차별 상담 기록 (CounselSession)
- [ ] **상담 일정 관리**: 상담사와 보호자 간 일정 조율 (Schedule)
- [ ] **상담 취소/변경**: 상담 일정 취소 및 변경 기능

### 4단계: 면담결과지 관리 (핵심 미구현)
- [ ] **면담결과지 생성**: 상담사가 상담 후 결과지 작성 (CounselReport)
- [ ] **결과지 템플릿**: 표준 양식 제공 및 커스터마이징
- [ ] **결과지 파일 첨부**: PDF, 이미지 등 첨부 기능
- [ ] **결과지 전송**: 상담사 → 보호자 전송
- [ ] **결과지 조회**: 보호자가 아동별 면담결과지 이력 조회
- [ ] **결과지 승인/피드백**: 보호자의 확인 및 피드백 기능

### 5단계: 데이터 분석 및 리포트
- [ ] **아동 발달 추이**: 상담 기록 기반 발달 그래프
- [ ] **상담 효과 분석**: 전후 비교 분석
- [ ] **기관별 통계**: 상담 건수, 평균 만족도 등
- [ ] **보고서 생성**: 부모용 종합 리포트 자동 생성

---

## 🏗️ 도메인별 구현 현황

### ✅ 인증/인가 (Auth)
- [x] 회원가입 (역할별: Guardian, Counselor, Institution)
- [x] 로그인 / 로그아웃
- [x] JWT 토큰 발급 및 갱신
- [x] 현재 사용자 정보 조회
- [ ] 이메일 인증
- [ ] 비밀번호 재설정
- [ ] 2단계 인증 (2FA)

### ✅ 보호자 관리 (Guardian)
- [x] 보호자 프로필 생성 (회원가입 시 자동)
- [x] 보호자 정보 조회
- [ ] 보호자 프로필 수정
- [ ] 보호자 삭제 (회원 탈퇴)

### ✅ 아동 관리 (Child)
- [x] 아동 등록 (보호자별)
- [x] 아동 목록 조회 (보호자별)
- [x] 아동 단건 조회
- [ ] 아동 정보 수정
- [ ] 아동 삭제
- [ ] 아동 상태 관리 (활성/비활성)

### ✅ 상담사 프로필 (Counselor)
- [x] 상담사 프로필 생성
- [x] 상담사 목록 조회 (페이지네이션)
- [x] 상담사 상세 조회
- [x] 상담사 프로필 수정
- [x] 상담사 삭제
- [ ] 상담사 전문 분야 관리
- [ ] 상담사 자격증 관리
- [ ] 상담사 가용 시간 관리

### ✅ 바우처 기관 (Institution)
- [x] 기관 생성 (ADMIN)
- [x] 기관 목록 조회 (페이지네이션)
- [x] 기관 상세 조회
- [x] 기관 수정 (ADMIN)
- [x] 기관 삭제 (ADMIN)
- [ ] 기관 승인 워크플로우
- [ ] 기관 운영 시간 관리
- [ ] 기관 소속 상담사 관리

### ✅ 상담의뢰지 (CounselRequest)
- [x] 상담의뢰지 생성 (보호자 직접)
- [x] 상담의뢰지 생성 (소울이 Webhook)
- [x] 상담의뢰지 목록 조회 (페이지네이션, 필터)
- [x] 상담의뢰지 단건 조회
- [x] 상담의뢰지 수정
- [x] 상담의뢰지 삭제
- [x] 아동별 상담의뢰지 조회
- [x] 보호자별 상담의뢰지 조회
- [x] AI 추천 요청
- [x] 추천 결과 조회
- [x] 추천 기관 선택
- [x] 상담 시작
- [x] 상담 완료
- [ ] 상담 중단/취소
- [ ] 상담의뢰지 재요청

### ✅ 리뷰 시스템 (Review)
- [x] 리뷰 작성
- [x] 리뷰 수정
- [x] 리뷰 삭제
- [ ] 리뷰 목록 조회 (기관별)
- [ ] 리뷰 평점 집계
- [ ] 리뷰 신고 기능

### ✅ 파일 업로드 (Upload)
- [x] 단일 이미지 업로드
- [x] 다중 이미지 업로드 (최대 3개)
- [ ] PDF 파일 업로드
- [ ] 파일 크기 제한 관리
- [ ] 파일 타입 검증 강화

### ❌ 면담결과지 (CounselReport) - **미구현**
- [ ] 면담결과지 생성 (상담사)
- [ ] 면담결과지 목록 조회 (아동별)
- [ ] 면담결과지 상세 조회
- [ ] 면담결과지 수정
- [ ] 면담결과지 삭제
- [ ] 면담결과지 전송 (상담사 → 보호자)
- [ ] 면담결과지 확인 (보호자)
- [ ] 면담결과지 피드백

### ❌ 상담 세션 (CounselSession) - **미구현**
- [ ] 상담 세션 생성
- [ ] 상담 세션 목록 조회
- [ ] 상담 세션 상세 조회
- [ ] 상담 세션 수정
- [ ] 상담 세션 삭제
- [ ] 세션별 메모 관리

### ❌ 일정 관리 (Schedule) - **미구현**
- [ ] 일정 생성
- [ ] 일정 목록 조회
- [ ] 일정 수정
- [ ] 일정 삭제
- [ ] 일정 충돌 검사
- [ ] 일정 알림

### ❌ 알림 시스템 (Notification) - **미구현**
- [ ] 알림 생성
- [ ] 알림 목록 조회
- [ ] 알림 읽음 처리
- [ ] 알림 설정 관리
- [ ] 이메일 알림
- [ ] 푸시 알림

---

## 🔧 인프라 및 설정

### ✅ 개발 환경
- [x] NestJS 프로젝트 설정
- [x] TypeORM 설정 (Entity 자동 동기화)
- [x] PostgreSQL Docker 컨테이너
- [x] MinIO Docker 컨테이너 (S3 호환)
- [x] JWT 인증 설정
- [x] Swagger API 문서
- [x] ESLint + Prettier
- [x] Git 브랜치 전략

### ⚠️ 테스트
- [x] Jest 설정
- [ ] 단위 테스트 (Domain Layer)
- [ ] 통합 테스트 (Use Cases)
- [ ] E2E 테스트 (API)
- [ ] 테스트 커버리지 90% 이상

### ⚠️ 배포
- [ ] 환경 변수 관리 (.env 분리)
- [ ] Docker Compose (프로덕션)
- [ ] CI/CD 파이프라인
- [ ] 로깅 시스템 강화
- [ ] 모니터링 (헬스체크)
- [ ] 에러 추적 (Sentry 등)

### ⚠️ 보안
- [x] JWT 토큰 기반 인증
- [x] 비밀번호 해싱 (bcrypt)
- [ ] RBAC (역할 기반 접근 제어) 강화
- [ ] Rate Limiting
- [ ] CORS 정책 강화
- [ ] XSS, CSRF 방어
- [ ] SQL Injection 방어 (TypeORM Parameterized Queries)

---

## 🚀 우선순위별 개발 계획

### 🔥 High Priority (핵심 기능)
1. **면담결과지 관리 시스템** (CounselReport)
   - 상담사가 결과지 작성/전송
   - 보호자가 결과지 조회
   - DDD 구조로 완전 구현 (Domain → Application → Infrastructure → Presentation)

2. **권한 관리 강화** (RBAC)
   - 역할별 접근 권한 세분화
   - Guard 및 Decorator 구현
   - ADMIN, COUNSELOR, GUARDIAN, INSTITUTION_ADMIN 권한 분리

3. **테스트 커버리지 향상**
   - Domain Layer 단위 테스트 (Value Objects, Entities)
   - Use Cases 통합 테스트
   - API E2E 테스트
   - 목표: 90% 이상

### ⚡ Medium Priority (중요 기능)
4. **상담 세션 관리** (CounselSession)
   - 회차별 상담 기록
   - 세션별 메모 및 상태 관리

5. **일정 관리 시스템** (Schedule)
   - 상담 일정 예약
   - 일정 충돌 검사
   - 일정 변경/취소

6. **알림 시스템** (Notification)
   - 이메일 알림 (상담 예약, 결과지 도착 등)
   - 인앱 알림
   - 알림 설정 관리

### 💡 Low Priority (개선 사항)
7. **데이터 분석 및 리포트**
   - 아동 발달 추이 그래프
   - 기관별 통계
   - 부모용 종합 리포트

8. **UI/UX 개선**
   - 파일 업로드 진행률 표시
   - 드래그 앤 드롭 업로드
   - 반응형 디자인

9. **성능 최적화**
   - 데이터베이스 인덱싱
   - 쿼리 최적화
   - 캐싱 전략 (Redis)

---

## 📝 개발 진행 시 체크리스트 사용법

### 새 기능 개발 시
1. ✅ 해당 기능을 체크리스트에서 찾기
2. ✅ [ ] → [x] 로 변경하며 진행 상황 업데이트
3. ✅ 커밋 시 관련 체크리스트 항목 언급
   - 예: `✨ feat(report): 면담결과지 생성 기능 구현 (#면담결과지-생성)`

### 정기 리뷰 시
- 주간/월간 단위로 체크리스트 점검
- 완료율 계산 및 진행 상황 공유
- 우선순위 재조정

### 체크리스트 업데이트
- 새로운 요구사항 발견 시 즉시 추가
- 불필요한 항목은 삭제 또는 보류 표시
- 항상 최신 상태 유지