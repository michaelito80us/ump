-- Database initialization script for UMP development
-- This script sets up the initial database structure

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant permissions to the user
GRANT ALL PRIVILEGES ON DATABASE ump_dev TO ump_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO ump_user;

-- Set timezone
SET timezone = 'UTC';

-- Log successful initialization
SELECT 'Database initialized successfully' AS status;