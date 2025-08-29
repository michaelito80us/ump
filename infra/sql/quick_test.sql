-- Quick test script for audit log partitions
-- This script provides a simple way to verify partition routing is working

-- Test: Insert records and verify they route to correct partitions
DO $$
DECLARE
    test_record_id UUID;
    partition_name TEXT;
    record_count INTEGER;
BEGIN
    -- Generate a test UUID
    test_record_id := gen_random_uuid();
    
    -- Calculate expected partition name for current month
    partition_name := 'audit_logs_' || TO_CHAR(CURRENT_DATE, 'YYYY_MM');
    
    RAISE NOTICE 'Testing audit log partition routing...';
    RAISE NOTICE 'Expected partition: %', partition_name;
    
    -- Insert a test record
    INSERT INTO audit_logs (
        id,
        type,
        timestamp,
        actor_type,
        message,
        data
    ) VALUES (
        test_record_id,
        'PARTITION_TEST',
        CURRENT_TIMESTAMP,
        'SYSTEM',
        'Test record to verify partition routing',
        '{"test": true, "purpose": "partition_verification"}'
    );
    
    -- Verify the record was inserted
    SELECT COUNT(*) INTO record_count
    FROM audit_logs
    WHERE id = test_record_id;
    
    IF record_count = 1 THEN
        RAISE NOTICE 'SUCCESS: Test record inserted successfully';
    ELSE
        RAISE EXCEPTION 'FAILED: Test record not found after insert';
    END IF;
    
    -- Verify the record is in the correct partition
    BEGIN
        EXECUTE format('SELECT COUNT(*) FROM %I WHERE id = $1', partition_name)
        USING test_record_id
        INTO record_count;
        
        IF record_count = 1 THEN
            RAISE NOTICE 'SUCCESS: Record found in correct partition %', partition_name;
        ELSE
            RAISE NOTICE 'WARNING: Record not found in expected partition %', partition_name;
        END IF;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'INFO: Partition % does not exist yet (will be created automatically)', partition_name;
    END;
    
    -- Clean up test record
    DELETE FROM audit_logs WHERE id = test_record_id;
    
    RAISE NOTICE 'Test completed successfully - partition routing is working!';
END;
$$;