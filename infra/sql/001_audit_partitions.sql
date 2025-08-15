-- Partitioned Audit Log Table Implementation
-- This DDL creates monthly partitions for immutable audit logging
-- Designed for PostgreSQL with automatic partition management

-- Create the main audit_logs table as a partitioned table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor_id UUID,
    actor_type VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    tournament_id UUID,
    phase_id UUID,
    match_id UUID,
    player_id UUID,
    team_id UUID,
    field VARCHAR(100),
    original_value TEXT,
    new_value TEXT,
    affected_entity VARCHAR(50),
    entity_id UUID,
    context TEXT,
    approved_by_id UUID,
    approval_note TEXT,
    approval_timestamp TIMESTAMPTZ,
    source VARCHAR(50),
    score_a INTEGER,
    score_b INTEGER,
    breakdown JSONB,
    description TEXT,
    action VARCHAR(50),
    reason TEXT,
    
    -- Partition key must be included in primary key for partitioned tables
    CONSTRAINT audit_logs_pkey PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Create indexes on the main table
CREATE INDEX IF NOT EXISTS idx_audit_logs_type_timestamp ON audit_logs (type, timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tournament_id ON audit_logs (tournament_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs (entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp);

-- Function to create monthly partitions automatically
CREATE OR REPLACE FUNCTION create_monthly_audit_partition(partition_date DATE)
RETURNS VOID AS $$
DECLARE
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    -- Calculate partition boundaries
    start_date := DATE_TRUNC('month', partition_date);
    end_date := start_date + INTERVAL '1 month';
    
    -- Generate partition name (e.g., audit_logs_2024_01)
    partition_name := 'audit_logs_' || TO_CHAR(start_date, 'YYYY_MM');
    
    -- Create the partition if it doesn't exist
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs
        FOR VALUES FROM (%L) TO (%L)
    ', partition_name, start_date, end_date);
    
    -- Create partition-specific indexes for better performance
    EXECUTE format('
        CREATE INDEX IF NOT EXISTS %I ON %I (type, timestamp)
    ', partition_name || '_type_timestamp_idx', partition_name);
    
    EXECUTE format('
        CREATE INDEX IF NOT EXISTS %I ON %I (actor_id)
    ', partition_name || '_actor_id_idx', partition_name);
    
    EXECUTE format('
        CREATE INDEX IF NOT EXISTS %I ON %I (tournament_id)
    ', partition_name || '_tournament_id_idx', partition_name);
    
    RAISE NOTICE 'Created partition: %', partition_name;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create partitions for the next 12 months
CREATE OR REPLACE FUNCTION ensure_audit_partitions()
RETURNS VOID AS $$
DECLARE
    current_month DATE;
    i INTEGER;
BEGIN
    current_month := DATE_TRUNC('month', CURRENT_DATE);
    
    -- Create partitions for current month and next 11 months
    FOR i IN 0..11 LOOP
        PERFORM create_monthly_audit_partition(current_month + (i || ' months')::INTERVAL);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to automatically create partitions when needed
CREATE OR REPLACE FUNCTION audit_log_insert_trigger()
RETURNS TRIGGER AS $$
DECLARE
    partition_date DATE;
BEGIN
    partition_date := DATE_TRUNC('month', NEW.timestamp);
    
    -- Try to create partition if it doesn't exist
    BEGIN
        PERFORM create_monthly_audit_partition(partition_date);
    EXCEPTION
        WHEN duplicate_table THEN
            -- Partition already exists, continue
            NULL;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically handle partition creation
CREATE TRIGGER audit_log_partition_trigger
    BEFORE INSERT ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_insert_trigger();

-- Function to clean up old partitions (older than specified months)
CREATE OR REPLACE FUNCTION cleanup_old_audit_partitions(retention_months INTEGER DEFAULT 24)
RETURNS VOID AS $$
DECLARE
    partition_record RECORD;
    cutoff_date DATE;
BEGIN
    cutoff_date := DATE_TRUNC('month', CURRENT_DATE - (retention_months || ' months')::INTERVAL);
    
    -- Find and drop old partitions
    FOR partition_record IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE tablename LIKE 'audit_logs_%'
        AND schemaname = 'public'
    LOOP
        -- Extract date from partition name and check if it's old enough
        DECLARE
            partition_date DATE;
            date_part TEXT;
        BEGIN
            -- Extract YYYY_MM from partition name
            date_part := SUBSTRING(partition_record.tablename FROM 'audit_logs_([0-9]{4}_[0-9]{2})');
            
            IF date_part IS NOT NULL THEN
                partition_date := TO_DATE(date_part, 'YYYY_MM');
                
                IF partition_date < cutoff_date THEN
                    EXECUTE format('DROP TABLE IF EXISTS %I', partition_record.tablename);
                    RAISE NOTICE 'Dropped old partition: %', partition_record.tablename;
                END IF;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Error processing partition %: %', partition_record.tablename, SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Initialize partitions for the current and next 11 months
SELECT ensure_audit_partitions();

-- Create a view for easier querying across all partitions
CREATE OR REPLACE VIEW audit_logs_view AS
SELECT 
    id,
    type,
    timestamp,
    actor_id,
    actor_type,
    message,
    data,
    tournament_id,
    phase_id,
    match_id,
    player_id,
    team_id,
    field,
    original_value,
    new_value,
    affected_entity,
    entity_id,
    context,
    approved_by_id,
    approval_note,
    approval_timestamp,
    source,
    score_a,
    score_b,
    breakdown,
    description,
    action,
    reason
FROM audit_logs
ORDER BY timestamp DESC;

-- Grant appropriate permissions
GRANT SELECT, INSERT ON audit_logs TO PUBLIC;
GRANT SELECT ON audit_logs_view TO PUBLIC;
GRANT EXECUTE ON FUNCTION create_monthly_audit_partition(DATE) TO PUBLIC;
GRANT EXECUTE ON FUNCTION ensure_audit_partitions() TO PUBLIC;

-- Comments for documentation
COMMENT ON TABLE audit_logs IS 'Partitioned audit log table with monthly partitions for immutable event tracking';
COMMENT ON FUNCTION create_monthly_audit_partition(DATE) IS 'Creates a monthly partition for the specified date';
COMMENT ON FUNCTION ensure_audit_partitions() IS 'Ensures partitions exist for the next 12 months';
COMMENT ON FUNCTION cleanup_old_audit_partitions(INTEGER) IS 'Removes audit partitions older than specified months (default: 24)';
COMMENT ON FUNCTION audit_log_insert_trigger() IS 'Trigger function to automatically create partitions on insert';
COMMENT ON VIEW audit_logs_view IS 'Convenient view for querying across all audit log partitions';