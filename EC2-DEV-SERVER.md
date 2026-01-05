# Yeirin MSA - EC2 개발서버 정보

## 🖥️ 서버 정보

| 항목 | 값 |
|------|-----|
| **Instance ID** | `i-0108499234f07592f` |
| **Instance Name** | `yeirin-dev-server` |
| **Public IP** | `13.124.149.80` |
| **Instance Type** | `t3.medium` (2 vCPU, 4GB RAM) |
| **AMI** | Amazon Linux 2023 |
| **Region** | `ap-northeast-2` (Seoul) |
| **Storage** | 30GB gp3 |
| **Security Group** | `yeirin-dev-sg` (`sg-0f514767b9009425e`) |

## 🔐 SSH 접속

```bash
# SSH 키 위치
~/.ssh/yeirin-dev-key.pem

# 접속 명령어
ssh -i ~/.ssh/yeirin-dev-key.pem ec2-user@13.124.149.80
```

## 🌐 서비스 엔드포인트

| 서비스 | URL | 포트 | 설명 |
|--------|-----|------|------|
| **Yeirin Backend** | http://13.124.149.80:3000 | 3000 | NestJS 메인 백엔드 |
| **Soul-E** | http://13.124.149.80:8000 | 8000 | FastAPI LLM 챗봇 |
| **Yeirin-AI** | http://13.124.149.80:8001 | 8001 | FastAPI 추천 시스템 |
| **Swagger** | http://13.124.149.80:3000/api | - | API 문서 |
| **PostgreSQL** | `postgres:5432` (내부) | 5432 | 데이터베이스 |

## 🏥 헬스체크 URL

```bash
# Yeirin Backend
curl http://13.124.149.80:3000/health

# Soul-E
curl http://13.124.149.80:8000/health

# Yeirin-AI
curl http://13.124.149.80:8001/api/v1/health
```

## 🐳 Docker 컨테이너

| 컨테이너명 | 이미지 | 포트 |
|-----------|--------|------|
| `yeirin-backend` | `920398710909.dkr.ecr.ap-northeast-2.amazonaws.com/yeirin-backend:latest` | 3000 |
| `soul-e-backend` | `920398710909.dkr.ecr.ap-northeast-2.amazonaws.com/soul-e-backend:latest` | 8000 |
| `yeirin-ai` | `920398710909.dkr.ecr.ap-northeast-2.amazonaws.com/yeirin-ai:latest` | 8001 |
| `yeirin-postgres` | `postgres:16-alpine` | 5432 |

## 📂 서버 내 파일 구조

```
/home/ec2-user/
└── yeirin/
    └── yeirin/                    # yeirin-backend 레포지토리
        ├── docker-compose.dev.yml # Docker Compose 설정
        ├── .env                   # 환경변수 (Parameter Store에서 생성)
        └── scripts/
            └── init-db.sql        # DB 초기화 스크립트
```

## 🔧 주요 명령어

### 서비스 관리

```bash
# 프로젝트 디렉토리 이동
cd ~/yeirin/yeirin

# 전체 서비스 상태 확인
docker-compose -f docker-compose.dev.yml ps

# 전체 서비스 재시작
docker-compose -f docker-compose.dev.yml restart

# 특정 서비스 재시작
docker-compose -f docker-compose.dev.yml restart yeirin

# 서비스 중지
docker-compose -f docker-compose.dev.yml down

# 서비스 시작
docker-compose -f docker-compose.dev.yml up -d
```

### 로그 확인

```bash
# Yeirin Backend 로그
docker logs yeirin-backend -f --tail 100

# Soul-E 로그
docker logs soul-e-backend -f --tail 100

# Yeirin-AI 로그
docker logs yeirin-ai -f --tail 100

# PostgreSQL 로그
docker logs yeirin-postgres -f --tail 100

# 전체 로그
docker-compose -f docker-compose.dev.yml logs -f
```

### 데이터베이스 접속

```bash
# yeirin_dev 데이터베이스 접속
docker exec -it yeirin-postgres psql -U yeirin -d yeirin_dev

# soul_e 데이터베이스 접속
docker exec -it yeirin-postgres psql -U yeirin -d soul_e

# 데이터베이스 목록 확인
docker exec -it yeirin-postgres psql -U yeirin -l
```

### 이미지 업데이트

```bash
# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 920398710909.dkr.ecr.ap-northeast-2.amazonaws.com

# 최신 이미지 Pull
docker-compose -f docker-compose.dev.yml pull

# 컨테이너 재생성
docker-compose -f docker-compose.dev.yml up -d
```

### 최신 코드 반영

```bash
cd ~/yeirin/yeirin
git pull origin deploy/dev
docker-compose -f docker-compose.dev.yml up -d
```

## 🔒 보안 그룹 규칙

| 포트 | 프로토콜 | 소스 | 설명 |
|------|---------|------|------|
| 22 | TCP | 0.0.0.0/0 | SSH |
| 3000 | TCP | 0.0.0.0/0 | Yeirin Backend |
| 8000 | TCP | 0.0.0.0/0 | Soul-E |
| 8001 | TCP | 0.0.0.0/0 | Yeirin-AI |

## 📊 리소스 모니터링

```bash
# Docker 리소스 사용량
docker stats

# 시스템 메모리
free -h

# 디스크 사용량
df -h
```

## ⚠️ 주의사항

1. **SSH 키 보관**: `~/.ssh/yeirin-dev-key.pem` 파일은 안전하게 보관
2. **비용**: t3.medium 인스턴스는 시간당 약 $0.052 (월 ~$38)
3. **데이터**: PostgreSQL 데이터는 Docker 볼륨에 저장됨 (`postgres-data`)
4. **AWS 크레덴셜**: EC2 내 `~/.aws/` 디렉토리에 저장됨

## 🔄 배포 워크플로우

1. 로컬에서 코드 수정 후 `deploy/dev` 브랜치에 커밋/푸시
2. 로컬에서 Docker 이미지 빌드 (`--platform linux/amd64`)
3. ECR에 이미지 푸시
4. EC2에서 이미지 Pull 및 컨테이너 재시작

```bash
# 로컬에서 (M1 Mac)
docker build --platform linux/amd64 -t yeirin-backend .
docker tag yeirin-backend:latest 920398710909.dkr.ecr.ap-northeast-2.amazonaws.com/yeirin-backend:latest
docker push 920398710909.dkr.ecr.ap-northeast-2.amazonaws.com/yeirin-backend:latest

# EC2에서
docker-compose -f docker-compose.dev.yml pull yeirin
docker-compose -f docker-compose.dev.yml up -d yeirin
```

---

**생성일**: 2025-12-05
**AWS Account ID**: 920398710909
