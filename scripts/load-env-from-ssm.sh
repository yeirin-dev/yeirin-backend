#!/bin/bash
# ============================================
# Load environment variables from AWS Parameter Store
# Usage: source ./scripts/load-env-from-ssm.sh [env]
# Example: source ./scripts/load-env-from-ssm.sh dev
# ============================================

set -e

ENV=${1:-dev}
PREFIX="/yeirin/${ENV}"

echo "Loading environment variables from ${PREFIX}..."

# Common parameters
export JWT_SECRET=$(aws ssm get-parameter --name "${PREFIX}/common/jwt-secret" --with-decryption --query "Parameter.Value" --output text)
export INTERNAL_API_SECRET=$(aws ssm get-parameter --name "${PREFIX}/common/internal-api-secret" --with-decryption --query "Parameter.Value" --output text)

# Yeirin-specific parameters
export NODE_ENV=$(aws ssm get-parameter --name "${PREFIX}/yeirin/node-env" --query "Parameter.Value" --output text)
export PORT=$(aws ssm get-parameter --name "${PREFIX}/yeirin/port" --query "Parameter.Value" --output text)
export LOG_LEVEL=$(aws ssm get-parameter --name "${PREFIX}/yeirin/log-level" --query "Parameter.Value" --output text)

# Database
export DB_HOST=$(aws ssm get-parameter --name "${PREFIX}/yeirin/db-host" --query "Parameter.Value" --output text)
export DB_PORT=$(aws ssm get-parameter --name "${PREFIX}/yeirin/db-port" --query "Parameter.Value" --output text)
export DB_USERNAME=$(aws ssm get-parameter --name "${PREFIX}/yeirin/db-username" --with-decryption --query "Parameter.Value" --output text)
export DB_PASSWORD=$(aws ssm get-parameter --name "${PREFIX}/yeirin/db-password" --with-decryption --query "Parameter.Value" --output text)
export DB_DATABASE=$(aws ssm get-parameter --name "${PREFIX}/yeirin/db-database" --query "Parameter.Value" --output text)

# JWT
export JWT_ACCESS_TOKEN_EXPIRATION=$(aws ssm get-parameter --name "${PREFIX}/yeirin/jwt-access-expiration" --query "Parameter.Value" --output text)
export JWT_REFRESH_TOKEN_EXPIRATION=$(aws ssm get-parameter --name "${PREFIX}/yeirin/jwt-refresh-expiration" --query "Parameter.Value" --output text)

# AWS S3
export AWS_REGION=$(aws ssm get-parameter --name "${PREFIX}/yeirin/aws-region" --query "Parameter.Value" --output text)
export AWS_S3_BUCKET_NAME=$(aws ssm get-parameter --name "${PREFIX}/yeirin/s3-bucket-name" --query "Parameter.Value" --output text)

# AI Service
export AI_RECOMMENDATION_SERVICE_URL=$(aws ssm get-parameter --name "${PREFIX}/yeirin/ai-service-url" --query "Parameter.Value" --output text)
export AI_RECOMMENDATION_API_TIMEOUT=$(aws ssm get-parameter --name "${PREFIX}/yeirin/ai-service-timeout" --query "Parameter.Value" --output text)

echo "Environment variables loaded successfully from ${PREFIX}"
