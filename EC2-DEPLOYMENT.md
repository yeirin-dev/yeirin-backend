# EC2 Development Server Deployment Guide

## Prerequisites

1. **Docker & Docker Compose** installed on EC2
2. **AWS CLI** configured with ECR access
3. **Git** for pulling deploy/dev branch

## Quick Start

### 1. Clone Repository

```bash
cd /opt
git clone <repository-url> yeirin-product
cd yeirin-product/backend/yeirin
git checkout deploy/dev
```

### 2. Configure Environment Variables

```bash
# Copy the example file
cp .env.ec2.example .env

# Edit with your values (from AWS Parameter Store)
nano .env
```

Required variables:
- `AWS_ACCOUNT_ID`: Your AWS account ID (920398710909)
- `DB_PASSWORD`: PostgreSQL password
- `JWT_SECRET`: JWT signing secret
- `OPENAI_API_KEY`: OpenAI API key
- `INTERNAL_API_SECRET`: Internal service communication secret
- `WEBHOOK_SECRET`: Webhook validation secret
- `INPSYT_AUTH_TOKEN`: Inpsyt API token

### 3. Login to ECR

```bash
aws ecr get-login-password --region ap-northeast-2 | \
    docker login --username AWS --password-stdin \
    920398710909.dkr.ecr.ap-northeast-2.amazonaws.com
```

### 4. Pull Images and Start Services

```bash
# Pull latest images
docker compose -f docker-compose.dev.yml pull

# Start all services
docker compose -f docker-compose.dev.yml up -d

# Check status
docker compose -f docker-compose.dev.yml ps
```

## Service Ports

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Database |
| Yeirin Backend | 3000 | NestJS API |
| Soul-E | 8000 | FastAPI (LLM Chat) |
| Yeirin-AI | 8001 | FastAPI (Recommendations) |

## Service Startup Order

1. **PostgreSQL** → Starts first, healthcheck ensures readiness
2. **Yeirin-AI** → No DB dependency, starts after postgres healthy
3. **Yeirin Backend** → Waits for postgres + yeirin-ai
4. **Soul-E** → Waits for postgres + yeirin

## Useful Commands

### View Logs

```bash
# All services
docker compose -f docker-compose.dev.yml logs -f

# Specific service
docker compose -f docker-compose.dev.yml logs -f yeirin
docker compose -f docker-compose.dev.yml logs -f soul-e
docker compose -f docker-compose.dev.yml logs -f yeirin-ai
docker compose -f docker-compose.dev.yml logs -f postgres
```

### Restart Services

```bash
# Restart all
docker compose -f docker-compose.dev.yml restart

# Restart specific service
docker compose -f docker-compose.dev.yml restart yeirin
```

### Update to Latest Images

```bash
# Pull new images
docker compose -f docker-compose.dev.yml pull

# Recreate containers with new images
docker compose -f docker-compose.dev.yml up -d
```

### Database Access

```bash
# Connect to PostgreSQL
docker exec -it yeirin-postgres psql -U yeirin -d yeirin_dev

# Connect to soul_e database
docker exec -it yeirin-postgres psql -U yeirin -d soul_e
```

### Stop All Services

```bash
docker compose -f docker-compose.dev.yml down

# Remove volumes (WARNING: Deletes all data)
docker compose -f docker-compose.dev.yml down -v
```

## Health Checks

```bash
# Check all services health
curl http://localhost:3000/health  # Yeirin Backend
curl http://localhost:8000/health  # Soul-E
curl http://localhost:8001/health  # Yeirin-AI
```

## Troubleshooting

### Database Connection Failed

1. Check if postgres container is healthy:
   ```bash
   docker compose -f docker-compose.dev.yml ps postgres
   ```

2. Verify database was initialized:
   ```bash
   docker exec -it yeirin-postgres psql -U yeirin -l
   ```

### ECR Pull Failed

1. Re-authenticate with ECR:
   ```bash
   aws ecr get-login-password --region ap-northeast-2 | \
       docker login --username AWS --password-stdin \
       920398710909.dkr.ecr.ap-northeast-2.amazonaws.com
   ```

### Service Not Starting

1. Check container logs:
   ```bash
   docker compose -f docker-compose.dev.yml logs <service-name>
   ```

2. Verify environment variables:
   ```bash
   docker compose -f docker-compose.dev.yml config
   ```

## Data Persistence

Data is persisted in Docker volumes:
- `postgres-data`: PostgreSQL database files
- `soul-e-chroma`: ChromaDB vector store for Soul-E

Backup volumes before any destructive operations:
```bash
docker run --rm -v yeirin_postgres-data:/data -v $(pwd):/backup \
    alpine tar czf /backup/postgres-backup.tar.gz /data
```
