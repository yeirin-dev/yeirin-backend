# MinIO 로컬 S3 스토리지 설정 가이드

로컬 개발 환경에서 AWS S3 대신 **MinIO**를 사용하여 파일 업로드를 테스트할 수 있습니다.

## 🚀 빠른 시작

### 1. MinIO 실행

```bash
# Docker Compose로 PostgreSQL + MinIO 실행
docker-compose up -d

# 상태 확인
docker-compose ps
```

### 2. MinIO 웹 콘솔 접속

**URL**: http://localhost:9001

**로그인 정보**:
- Username: `minioadmin`
- Password: `minioadmin123`

### 3. 백엔드 서버 실행

```bash
yarn start:dev
```

### 4. 파일 업로드 테스트

프론트엔드에서 상담의뢰지 작성 → 검사 결과 이미지 업로드하면 자동으로 MinIO에 저장됩니다.

## 📁 MinIO 구조

### 버킷 정보
- **버킷 이름**: `yeirin-counsel-requests`
- **자동 생성**: Docker Compose 실행 시 자동으로 생성됨
- **접근 권한**: 공개 다운로드 허용 (읽기 전용)

### 저장 경로
업로드된 파일은 다음 경로에 저장됩니다:
```
counsel-requests/
  ├── {uuid}.jpg
  ├── {uuid}.png
  └── ...
```

### 파일 URL 형식
```
http://localhost:9000/yeirin-counsel-requests/counsel-requests/{uuid}.{ext}
```

## 🔧 환경 변수 (.env)

```bash
# MinIO 로컬 개발 설정
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin123
AWS_S3_BUCKET_NAME=yeirin-counsel-requests
AWS_S3_ENDPOINT=http://localhost:9000
AWS_S3_BASE_URL=http://localhost:9000/yeirin-counsel-requests
AWS_S3_FORCE_PATH_STYLE=true
```

## 🌐 API 엔드포인트

### 단일 이미지 업로드
```http
POST http://localhost:3000/upload/image
Authorization: Bearer {JWT_TOKEN}
Content-Type: multipart/form-data

file: {이미지 파일}
```

**응답**:
```json
{
  "url": "http://localhost:9000/yeirin-counsel-requests/counsel-requests/uuid.jpg"
}
```

### 여러 이미지 업로드 (최대 3개)
```http
POST http://localhost:3000/upload/images
Authorization: Bearer {JWT_TOKEN}
Content-Type: multipart/form-data

files: [{이미지1}, {이미지2}, {이미지3}]
```

**응답**:
```json
{
  "urls": [
    "http://localhost:9000/yeirin-counsel-requests/counsel-requests/uuid1.jpg",
    "http://localhost:9000/yeirin-counsel-requests/counsel-requests/uuid2.jpg"
  ]
}
```

## 📝 파일 업로드 제한

- **최대 파일 크기**: 5MB
- **허용 형식**: jpg, jpeg, png, gif, webp
- **동시 업로드**: 최대 3개

## 🛠 Docker Compose 명령어

```bash
# 시작
docker-compose up -d

# 중지
docker-compose down

# 중지 + 볼륨 삭제 (모든 데이터 삭제)
docker-compose down -v

# 로그 확인
docker-compose logs minio
docker-compose logs postgres

# 재시작
docker-compose restart
```

## 🌍 프로덕션 배포 시

프로덕션 환경에서는 실제 AWS S3를 사용하세요:

```bash
# .env 파일 수정
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=실제_AWS_액세스_키
AWS_SECRET_ACCESS_KEY=실제_AWS_시크릿_키
AWS_S3_BUCKET_NAME=실제_버킷_이름
# AWS_S3_ENDPOINT 제거 (또는 주석 처리)
AWS_S3_BASE_URL=https://실제_버킷_이름.s3.ap-northeast-2.amazonaws.com
AWS_S3_FORCE_PATH_STYLE=false
```

## 📊 MinIO 웹 콘솔 기능

MinIO 웹 콘솔(http://localhost:9001)에서 다음 기능을 사용할 수 있습니다:

- ✅ 업로드된 파일 목록 확인
- ✅ 파일 다운로드
- ✅ 파일 삭제
- ✅ 버킷 관리
- ✅ 접근 권한 설정
- ✅ 사용량 모니터링

## 🔍 문제 해결

### MinIO 접속 안 됨
```bash
# MinIO 컨테이너 재시작
docker-compose restart minio

# 로그 확인
docker logs yeirin-minio
```

### 버킷이 없다는 에러
```bash
# 버킷 수동 생성 (디렉토리 생성)
docker exec yeirin-minio mkdir -p /data/yeirin-counsel-requests

# 또는 docker-compose 재시작으로 자동 생성
docker-compose down
docker-compose up -d

# 버킷 공개 읽기 권한 설정 (Node.js에서 실행)
cat > set-bucket-policy.js << 'EOF'
const { S3Client, PutBucketPolicyCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({
  region: 'us-east-1',
  credentials: { accessKeyId: 'minioadmin', secretAccessKey: 'minioadmin123' },
  endpoint: 'http://localhost:9000',
  forcePathStyle: true,
});
const policy = {
  Version: "2012-10-17",
  Statement: [{
    Effect: "Allow",
    Principal: {"AWS": ["*"]},
    Action: ["s3:GetObject"],
    Resource: ["arn:aws:s3:::yeirin-counsel-requests/*"]
  }]
};
s3Client.send(new PutBucketPolicyCommand({
  Bucket: 'yeirin-counsel-requests',
  Policy: JSON.stringify(policy)
})).then(() => console.log('✅ Success')).catch(err => console.error('❌ Error:', err.message));
EOF
node set-bucket-policy.js
```

### 파일 업로드 실패
1. MinIO가 실행 중인지 확인: `docker-compose ps`
2. .env 파일의 MinIO 설정 확인
3. 백엔드 서버 재시작: `yarn start:dev`
4. 백엔드 로그 확인

### 업로드된 파일이 보이지 않음
MinIO 웹 콘솔(http://localhost:9001)에서 직접 확인하세요.

## 💡 참고사항

- MinIO는 **로컬 개발 전용**입니다
- 모든 데이터는 Docker 볼륨에 저장됩니다
- `docker-compose down -v`를 실행하면 모든 데이터가 삭제됩니다
- 실제 AWS S3와 API 호환성이 100%이므로 코드 변경 없이 프로덕션 배포 가능합니다
