# Audit Log Partitioning System

This directory contains SQL DDL and utilities for implementing partitioned audit logging in PostgreSQL.

## Overview

The audit log partitioning system provides:

- **Monthly partitions** for immutable audit log storage
- **Automatic partition creation** via triggers and functions
- **Efficient querying** with partition pruning
- **Maintenance utilities** for cleanup and management
- **Performance optimization** with partition-specific indexes

## Files

- `001_audit_partitions.sql` - Main DDL for partitioned audit log table
- `test_audit_partitions.sql` - Comprehensive test suite
- `README.md` - This documentation

## Features

### Automatic Partition Management

- **Auto-creation**: Partitions are created automatically when data is inserted
- **Pre-provisioning**: Creates partitions for the next 12 months on initialization
- **Trigger-based**: Uses PostgreSQL triggers to handle partition creation seamlessly

### Performance Optimizations

- **Partition pruning**: Queries automatically target relevant partitions
- **Partition-specific indexes**: Each partition has optimized indexes
- **Efficient storage**: Monthly partitions enable faster queries and maintenance

### Maintenance Functions

#### `create_monthly_audit_partition(partition_date DATE)`

Creates a single monthly partition for the specified date.

```sql
-- Create partition for March 2024
SELECT create_monthly_audit_partition('2024-03-01');
```

#### `ensure_audit_partitions()`

Ensures partitions exist for the current month and next 11 months.

```sql
-- Ensure all needed partitions exist
SELECT ensure_audit_partitions();
```

#### `cleanup_old_audit_partitions(retention_months INTEGER)`

Removes partitions older than the specified retention period (default: 24 months).

```sql
-- Clean up partitions older than 12 months
SELECT cleanup_old_audit_partitions(12);
```

## Usage

### Initial Setup

1. **Run the DDL**: Execute `001_audit_partitions.sql` on your PostgreSQL database
2. **Verify setup**: Run `test_audit_partitions.sql` to ensure everything works correctly

```bash
# Apply the DDL
psql -d your_database -f 001_audit_partitions.sql

# Run tests
psql -d your_database -f test_audit_partitions.sql
```

### Inserting Audit Logs

Insert records normally into the `audit_logs` table. The partitioning is transparent:

```sql
INSERT INTO audit_logs (
    type, actor_type, message, data, tournament_id
) VALUES (
    'MATCH_SCORE_UPDATE',
    'USER',
    'Score updated for match',
    '{"match_id": "123", "old_score": [0,0], "new_score": [1,0]}',
    'tournament-uuid'
);
```

### Querying Audit Logs

Use either the main table or the convenience view:

```sql
-- Query main table (with automatic partition pruning)
SELECT * FROM audit_logs
WHERE timestamp >= '2024-01-01'
AND type = 'MATCH_SCORE_UPDATE';

-- Query via convenience view
SELECT * FROM audit_logs_view
WHERE tournament_id = 'tournament-uuid'
ORDER BY timestamp DESC
LIMIT 100;
```

### Maintenance Schedule

Recommended maintenance tasks:

```sql
-- Monthly: Ensure future partitions exist
SELECT ensure_audit_partitions();

-- Quarterly: Clean up old partitions (adjust retention as needed)
SELECT cleanup_old_audit_partitions(24); -- Keep 24 months

-- Monitor partition sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename LIKE 'audit_logs_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Schema Details

### Main Table Structure

The `audit_logs` table includes all fields from the original Prisma schema:

- **Core fields**: `id`, `type`, `timestamp`, `actor_id`, `actor_type`, `message`
- **Context fields**: `tournament_id`, `phase_id`, `match_id`, `player_id`, `team_id`
- **Change tracking**: `field`, `original_value`, `new_value`, `affected_entity`
- **Approval workflow**: `approved_by_id`, `approval_note`, `approval_timestamp`
- **Match scoring**: `score_a`, `score_b`, `breakdown`
- **Metadata**: `data` (JSONB), `context`, `source`, `description`, `action`, `reason`

### Partition Naming Convention

Partitions follow the pattern: `audit_logs_YYYY_MM`

Examples:

- `audit_logs_2024_01` (January 2024)
- `audit_logs_2024_12` (December 2024)

### Indexes

Each partition automatically gets these indexes:

- `type, timestamp` (compound)
- `actor_id`
- `tournament_id`

The main table also has:

- `timestamp` (for partition pruning)
- `entity_id` (for entity-based queries)

## Migration from Existing Schema

If you have existing audit logs in a non-partitioned table:

```sql
-- 1. Backup existing data
CREATE TABLE audit_logs_backup AS SELECT * FROM audit_logs;

-- 2. Drop existing table
DROP TABLE audit_logs;

-- 3. Run the partitioned DDL
\i 001_audit_partitions.sql

-- 4. Migrate data (this will automatically route to correct partitions)
INSERT INTO audit_logs SELECT * FROM audit_logs_backup;

-- 5. Verify migration
SELECT COUNT(*) FROM audit_logs;
SELECT COUNT(*) FROM audit_logs_backup;

-- 6. Drop backup when satisfied
DROP TABLE audit_logs_backup;
```

## Performance Considerations

- **Query performance**: Always include `timestamp` in WHERE clauses when possible
- **Partition pruning**: PostgreSQL automatically excludes irrelevant partitions
- **Index usage**: Partition-specific indexes provide optimal performance
- **Maintenance**: Regular cleanup prevents excessive partition accumulation

## Monitoring

### Check Partition Health

```sql
-- List all audit log partitions
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename LIKE 'audit_logs_%'
ORDER BY tablename;

-- Check for missing partitions
SELECT
    generate_series(
        date_trunc('month', CURRENT_DATE),
        date_trunc('month', CURRENT_DATE + INTERVAL '12 months'),
        '1 month'::interval
    )::date as expected_partition,
    'audit_logs_' || to_char(
        generate_series(
            date_trunc('month', CURRENT_DATE),
            date_trunc('month', CURRENT_DATE + INTERVAL '12 months'),
            '1 month'::interval
        ), 'YYYY_MM'
    ) as partition_name,
    EXISTS(
        SELECT 1 FROM pg_tables
        WHERE tablename = 'audit_logs_' || to_char(
            generate_series(
                date_trunc('month', CURRENT_DATE),
                date_trunc('month', CURRENT_DATE + INTERVAL '12 months'),
                '1 month'::interval
            ), 'YYYY_MM'
        )
    ) as exists;
```

### Performance Metrics

```sql
-- Query performance by partition
SELECT
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch
FROM pg_stat_user_tables
WHERE tablename LIKE 'audit_logs_%'
ORDER BY tablename;
```

## Troubleshooting

### Common Issues

1. **Partition not found**: Ensure `ensure_audit_partitions()` has been run
2. **Permission errors**: Verify database user has necessary privileges
3. **Performance issues**: Check if queries include timestamp filters
4. **Storage growth**: Run `cleanup_old_audit_partitions()` regularly

### Debug Queries

```sql
-- Check which partition a record would go to
SELECT 'audit_logs_' || TO_CHAR(TIMESTAMP '2024-03-15', 'YYYY_MM') as partition_name;

-- Verify trigger is working
SELECT tgname, tgenabled FROM pg_trigger WHERE tgrelid = 'audit_logs'::regclass;

-- Check partition constraints
SELECT
    tablename,
    pg_get_expr(c.conbin, c.conrelid) as constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_tables pt ON pt.tablename = t.relname
WHERE pt.tablename LIKE 'audit_logs_%'
AND c.contype = 'c';
```
