-- ============================================
-- Yeirin MSA - PostgreSQL Database Initialization
-- Creates databases for all MSA services
-- ============================================

-- Enable UUID extension for yeirin_dev (default database)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create soul_e database for Soul-E service
-- Note: yeirin_dev is created automatically via POSTGRES_DB env
CREATE DATABASE soul_e;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE soul_e TO yeirin;
