# Yeirin Backend - MSA Architecture

예이린 백엔드 마이크로서비스 아키텍처

## 📦 서비스 구조

```
backend/
├── yeirin/              # 메인 백엔드 (NestJS + TypeORM + PostgreSQL)
├── ai-recommendation/   # AI 추천 시스템 (FastAPI) - 예정
└── souli-integration/   # 소울이 통합 서비스 (FastAPI) - 예정
```

## 🎯 서비스별 역할

### 1. yeirin (메인 백엔드)
- 회원 관리 (부모, 상담사, 상담기관)
- 상담의뢰지 관리
- 상담 매칭 및 진행 관리
- 면담결과지 관리
- 전체 비즈니스 로직 관리

### 2. ai-recommendation (AI 추천 시스템)
- 상담의뢰지 텍스트 분석
- 상담기관 추천 알고리즘
- 협업 필터링 및 벡터 유사도 계산

### 3. souli-integration (소울이 통합)
- 소울이 챗봇과의 연동
- 상담의뢰지 자동 생성 데이터 수신
- 대화 로그 분석 및 전달

## 🚀 개발 시작하기

각 서비스 디렉토리로 이동하여 README를 참고하세요.

```bash
# Yeirin 메인 백엔드
cd yeirin
yarn install
yarn start:dev

# AI 추천 시스템 (예정)
cd ai-recommendation
pip install -r requirements.txt
uvicorn main:app --reload

# 소울이 통합 (예정)
cd souli-integration
pip install -r requirements.txt
uvicorn main:app --reload
```

## 🔗 서비스 간 통신

- **yeirin → ai-recommendation**: REST API (상담기관 추천 요청)
- **souli-integration → yeirin**: REST API (상담의뢰지 생성)
- **yeirin ↔ PostgreSQL**: 메인 데이터베이스

## 📚 관련 문서

- [메인 개발 가이드](./CLAUDE.md)
- [Git 컨벤션](./CLAUDE.md#git-브랜치--커밋-컨벤션)
