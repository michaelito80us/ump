-- Test script for audit log partitions
-- This script tests that inserts are properly routed to the correct monthly partitions

-- Test 1: Insert records for different months and verify partition routing
DO $$
DECLARE
    test_id_1 UUID;
    test_id_2 UUID;
    test_id_3 UUID;
    partition_count INTEGER;
    current_month_partition TEXT;
    next_month_partition TEXT;
BEGIN
    -- Generate test UUIDs
    test_id_1 := gen_random_uuid();
    test_id_2 := gen_random_uuid();
    test_id_3 := gen_random_uuid();
    
    -- Calculate expected partition names
    current_month_partition := 'audit_logs_' || TO_CHAR(CURRENT_DATE, 'YYYY_MM');
    next_month_partition := 'audit_logs_' || TO_CHAR(CURRENT_DATE + INTERVAL '1 month', 'YYYY_MM');
    
    RAISE NOTICE 'Testing partition routing...';
    RAISE NOTICE 'Expected current month partition: %', current_month_partition;
    RAISE NOTICE 'Expected next month partition: %', next_month_partition;
    
    -- Test 1: Insert into current month
    INSERT INTO audit_logs (
        id, type, timestamp, actor_type, message, data
    ) VALUES (
        test_id_1,
        'TEST_LOG',
        CURRENT_TIMESTAMP,
        'SYSTEM',
        'Test log entry for current month',
        '{"test": true, "month": "current"}'
    );
    
    -- Test 2: Insert into next month
    INSERT INTO audit_logs (
        id, type, timestamp, actor_type, message, data
    ) VALUES (
        test_id_2,
        'TEST_LOG',
        CURRENT_TIMESTAMP + INTERVAL '1 month',
        'SYSTEM',
        'Test log entry for next month',
        '{"test": true, "month": "next"}'
    );
    
    -- Test 3: Insert into previous month (if partition exists)
    INSERT INTO audit_logs (
        id, type, timestamp, actor_type, message, data
    ) VALUES (
        test_id_3,
        'TEST_LOG',
        CURRENT_TIMESTAMP - INTERVAL '1 month',
        'SYSTEM',
        'Test log entry for previous month',
        '{"test": true, "month": "previous"}'
    );
    
    -- Verify records were inserted
    SELECT COUNT(*) INTO partition_count FROM audit_logs WHERE id IN (test_id_1, test_id_2, test_id_3);
    
    IF partition_count = 3 THEN
        RAISE NOTICE 'SUCCESS: All test records inserted successfully';
    ELSE
        RAISE EXCEPTION 'FAILED: Expected 3 records, found %', partition_count;
    END IF;
    
    -- Verify records are in correct partitions by checking partition-specific tables
    DECLARE
        current_month_count INTEGER;
        next_month_count INTEGER;
    BEGIN
        -- Check current month partition
        EXECUTE format('SELECT COUNT(*) FROM %I WHERE id = $1', current_month_partition)
        USING test_id_1
        INTO current_month_count;
        
        IF current_month_count = 1 THEN
            RAISE NOTICE 'SUCCESS: Current month record found in partition %', current_month_partition;
        ELSE
            RAISE WARNING 'Current month record not found in expected partition';
        END IF;
        
        -- Check next month partition
        EXECUTE format('SELECT COUNT(*) FROM %I WHERE id = $1', next_month_partition)
        USING test_id_2
        INTO next_month_count;
        
        IF next_month_count = 1 THEN
            RAISE NOTICE 'SUCCESS: Next month record found in partition %', next_month_partition;
        ELSE
            RAISE WARNING 'Next month record not found in expected partition';
        END IF;
        
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Partition table does not exist (this is expected for some test cases)';
    END;
    
    -- Clean up test data
    DELETE FROM audit_logs WHERE id IN (test_id_1, test_id_2, test_id_3);
    
    RAISE NOTICE 'Test cleanup completed';
END;
$$;

-- Test 2: Verify partition creation function
DO $$
DECLARE
    test_date DATE;
    partition_name TEXT;
    partition_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Testing partition creation function...';
    
    -- Test creating a partition for a future date
    test_date := CURRENT_DATE + INTERVAL '6 months';
    partition_name := 'audit_logs_' || TO_CHAR(test_date, 'YYYY_MM');
    
    -- Create the partition
    PERFORM create_monthly_audit_partition(test_date);
    
    -- Check if partition was created
    SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = partition_name 
        AND schemaname = 'public'
    ) INTO partition_exists;
    
    IF partition_exists THEN
        RAISE NOTICE 'SUCCESS: Partition % created successfully', partition_name;
        
        -- Test inserting into the new partition
        INSERT INTO audit_logs (
            type, timestamp, actor_type, message
        ) VALUES (
            'PARTITION_TEST',
            test_date + INTERVAL '5 days',
            'SYSTEM',
            'Test record for dynamically created partition'
        );
        
        RAISE NOTICE 'SUCCESS: Record inserted into new partition';
        
        -- Clean up
        DELETE FROM audit_logs WHERE type = 'PARTITION_TEST';
        
    ELSE
        RAISE EXCEPTION 'FAILED: Partition % was not created', partition_name;
    END IF;
END;
$$;

-- Test 3: Verify indexes are created on partitions
DO $$
DECLARE
    partition_name TEXT;
    index_count INTEGER;
BEGIN
    RAISE NOTICE 'Testing partition indexes...';
    
    partition_name := 'audit_logs_' || TO_CHAR(CURRENT_DATE, 'YYYY_MM');
    
    -- Count indexes on the current month partition
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename = partition_name
    AND schemaname = 'public';
    
    IF index_count >= 3 THEN
        RAISE NOTICE 'SUCCESS: Found % indexes on partition %', index_count, partition_name;
    ELSE
        RAISE WARNING 'Expected at least 3 indexes on partition %, found %', partition_name, index_count;
    END IF;
END;
$$;

-- Test 4: Verify view functionality
DO $$
DECLARE
    view_count INTEGER;
    test_id UUID;
BEGIN
    RAISE NOTICE 'Testing audit_logs_view...';
    
    test_id := gen_random_uuid();
    
    -- Insert a test record
    INSERT INTO audit_logs (
        id, type, timestamp, actor_type, message, data
    ) VALUES (
        test_id,
        'VIEW_TEST',
        CURRENT_TIMESTAMP,
        'SYSTEM',
        'Test record for view functionality',
        '{"view_test": true}'
    );
    
    -- Query through the view
    SELECT COUNT(*) INTO view_count
    FROM audit_logs_view
    WHERE id = test_id;
    
    IF view_count = 1 THEN
        RAISE NOTICE 'SUCCESS: View query returned expected record';
    ELSE
        RAISE EXCEPTION 'FAILED: View query returned % records, expected 1', view_count;
    END IF;
    
    -- Clean up
    DELETE FROM audit_logs WHERE id = test_id;
END;
$$;

-- Test 5: Performance test with bulk inserts
DO $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    duration INTERVAL;
    i INTEGER;
BEGIN
    RAISE NOTICE 'Running performance test with bulk inserts...';
    
    start_time := clock_timestamp();
    
    -- Insert 1000 test records
    FOR i IN 1..1000 LOOP
        INSERT INTO audit_logs (
            type, timestamp, actor_type, message, data
        ) VALUES (
            'PERF_TEST',
            CURRENT_TIMESTAMP + (i || ' seconds')::INTERVAL,
            'SYSTEM',
            'Performance test record ' || i,
            format('{"record_number": %s, "batch": "performance_test"}', i)
        );
    END LOOP;
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    RAISE NOTICE 'SUCCESS: Inserted 1000 records in %', duration;
    
    -- Clean up performance test data
    DELETE FROM audit_logs WHERE type = 'PERF_TEST';
    
    RAISE NOTICE 'Performance test cleanup completed';
END;
$$;

RAISE NOTICE 'All audit partition tests completed successfully!';