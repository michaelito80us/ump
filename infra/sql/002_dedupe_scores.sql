-- Duplicate Score Submission Guard (T-16.1)
-- Prevents duplicate score submissions within 2 seconds
-- This migration adds constraints and indexes to the match_score_audits table

-- Add a unique constraint to prevent duplicate score submissions within 2 seconds
-- We'll use a partial unique index that groups by match_id, submitted_by, and a 2-second time window

-- First, create a function to truncate timestamp to 2-second intervals
CREATE OR REPLACE FUNCTION truncate_to_2_seconds(ts TIMESTAMPTZ)
RETURNS TIMESTAMPTZ AS $$
BEGIN
    -- Truncate to 2-second intervals by dividing epoch by 2, flooring, then multiplying back
    RETURN to_timestamp(floor(extract(epoch from ts) / 2) * 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a unique index to prevent duplicate submissions within 2-second windows
-- This will enforce the business rule at the database level
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_match_score_audit_dedupe
ON match_score_audits (
    match_id,
    submitted_by,
    truncate_to_2_seconds(submitted_at)
);

-- Add a comment explaining the constraint
COMMENT ON INDEX idx_match_score_audit_dedupe IS 
'Prevents duplicate score submissions within 2-second windows for the same match and user';

-- Create an additional index for efficient querying of recent submissions
-- This will help the service-level guard check for recent submissions quickly
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_score_audit_recent
ON match_score_audits (
    match_id,
    submitted_by,
    submitted_at DESC
)
WHERE submitted_at > NOW() - INTERVAL '10 seconds';

-- Add a comment for the recent submissions index
COMMENT ON INDEX idx_match_score_audit_recent IS 
'Optimizes queries for recent score submissions within the last 10 seconds';

-- Create a function to check for recent duplicate submissions
-- This can be used by the application layer for additional validation
CREATE OR REPLACE FUNCTION check_duplicate_score_submission(
    p_match_id TEXT,
    p_submitted_by TEXT,
    p_check_interval INTERVAL DEFAULT INTERVAL '2 seconds'
)
RETURNS BOOLEAN AS $$
DECLARE
    recent_count INTEGER;
BEGIN
    -- Count recent submissions within the specified interval
    SELECT COUNT(*)
    INTO recent_count
    FROM match_score_audits
    WHERE match_id = p_match_id
      AND submitted_by = p_submitted_by
      AND submitted_at > NOW() - p_check_interval;
    
    -- Return true if there are recent submissions (indicating a duplicate)
    RETURN recent_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Add a comment for the duplicate check function
COMMENT ON FUNCTION check_duplicate_score_submission(TEXT, TEXT, INTERVAL) IS 
'Checks if a user has submitted a score for a match within the specified time interval';

-- Create a trigger function to log duplicate submission attempts
CREATE OR REPLACE FUNCTION log_duplicate_score_attempt()
RETURNS TRIGGER AS $$
BEGIN
    -- This trigger will fire when a unique constraint violation occurs
    -- We can use this to log the duplicate attempt for monitoring
    INSERT INTO audit_logs (
        type,
        timestamp,
        actor_id,
        actor_type,
        message,
        match_id,
        data
    ) VALUES (
        'DUPLICATE_SCORE_ATTEMPT',
        NOW(),
        NEW.submitted_by,
        'user',
        'Duplicate score submission attempt blocked',
        NEW.match_id,
        jsonb_build_object(
            'score_a', NEW.score_a,
            'score_b', NEW.score_b,
            'source', NEW.source,
            'blocked_at', NOW()
        )
    );
    
    RETURN NULL; -- This is an AFTER trigger, so return value doesn't matter
END;
$$ LANGUAGE plpgsql;

-- Note: We cannot directly create a trigger for constraint violations
-- The application layer will need to catch the unique constraint violation
-- and handle it appropriately (return 409 status code)

-- Add helpful comments to the existing table
COMMENT ON TABLE match_score_audits IS 
'Audit trail for all match score submissions with duplicate prevention';

COMMENT ON COLUMN match_score_audits.match_id IS 
'Reference to the match being scored';

COMMENT ON COLUMN match_score_audits.submitted_by IS 
'User ID of the person submitting the score';

COMMENT ON COLUMN match_score_audits.submitted_at IS 
'Timestamp of score submission, used for duplicate detection';

-- Create a view for easy monitoring of duplicate attempts
CREATE OR REPLACE VIEW duplicate_score_attempts AS
SELECT 
    al.timestamp,
    al.actor_id as submitted_by,
    al.match_id,
    al.data->>'score_a' as attempted_score_a,
    al.data->>'score_b' as attempted_score_b,
    al.data->>'source' as source
FROM audit_logs al
WHERE al.type = 'DUPLICATE_SCORE_ATTEMPT'
ORDER BY al.timestamp DESC;

-- Add a comment for the monitoring view
COMMENT ON VIEW duplicate_score_attempts IS 
'View for monitoring blocked duplicate score submission attempts';

-- Performance optimization: Analyze the tables after creating indexes
ANALYZE match_score_audits;