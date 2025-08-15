import { NextRequest, NextResponse } from 'next/server';
import { AuditLog } from '@ump/core';

// Import required Node.js modules
import { URL } from 'url';
import { TextEncoder } from 'util';

// Mock audit log data for now - in real implementation this would come from database
const mockAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    type: 'MATCH_EVENT',
    timestamp: new Date('2025-01-01T10:00:00Z'),
    actorId: 'user-1',
    actorType: 'user',
    message: 'Match status updated',
    matchId: 'match-1',
    change: { status: 'final' },
  },
  {
    id: 'log-2',
    type: 'SCORE_SUBMISSION',
    timestamp: new Date('2025-01-01T11:00:00Z'),
    actorId: 'referee-1',
    actorType: 'user',
    message: 'Score submitted',
    matchId: 'match-1',
    submittedBy: 'referee-1',
    scoreA: 15,
    scoreB: 10,
    breakdown: {
      teamA: { tries: 3, conversions: 0 },
      teamB: { tries: 2, conversions: 0 },
    },
    source: 'manual',
  },
  {
    id: 'log-3',
    type: 'MANUAL_OVERRIDE',
    timestamp: new Date('2025-01-01T12:00:00Z'),
    actorId: 'admin-1',
    actorType: 'user',
    message: 'Manual override applied',
    field: 'venue',
    originalValue: 'Field A',
    newValue: 'Field B',
    affectedEntity: 'MATCH',
    entityId: 'match-1',
    context: 'Venue change due to weather',
  },
];

/**
 * Convert audit log to CSV row
 */
function auditLogToCsvRow(log: AuditLog): string {
  const baseFields = [
    log.id,
    log.type,
    log.timestamp.toISOString(),
    log.actorId,
    log.actorType,
    log.message || '',
  ];

  // Add type-specific fields based on log type
  let specificFields: string[] = [];

  switch (log.type) {
    case 'MATCH_EVENT':
      specificFields = [
        log.matchId,
        JSON.stringify(log.change),
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '', // Empty fields for other types
      ];
      break;
    case 'SCORE_SUBMISSION':
      specificFields = [
        log.matchId,
        '',
        log.submittedBy,
        log.scoreA.toString(),
        log.scoreB.toString(),
        JSON.stringify(log.breakdown),
        log.source,
        '',
        '',
        '', // Empty fields for other types
      ];
      break;
    case 'MANUAL_OVERRIDE':
      specificFields = [
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        log.field,
        JSON.stringify(log.originalValue),
        JSON.stringify(log.newValue),
        log.affectedEntity,
        log.entityId,
        log.context,
      ];
      break;
    default:
      // Fill with empty strings for unknown types
      specificFields = new Array(13).fill('');
  }

  return [...baseFields, ...specificFields]
    .map((field) => `"${String(field).replace(/"/g, '""')}"`) // Escape quotes
    .join(',');
}

/**
 * Convert audit log to NDJSON line
 */
function auditLogToNdjsonLine(log: AuditLog): string {
  return JSON.stringify(log);
}

/**
 * Get CSV header row
 */
function getCsvHeader(): string {
  return [
    'id',
    'type',
    'timestamp',
    'actorId',
    'actorType',
    'message',
    // Type-specific fields
    'matchId',
    'change',
    'submittedBy',
    'scoreA',
    'scoreB',
    'breakdown',
    'source',
    'field',
    'originalValue',
    'newValue',
    'affectedEntity',
    'entityId',
    'context',
  ]
    .map((header) => `"${header}"`)
    .join(',');
}

/**
 * Stream audit logs as CSV or NDJSON
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const tournamentId = searchParams.get('tournamentId');
    const limit = parseInt(searchParams.get('limit') || '1000');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate format
    if (!['csv', 'ndjson'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be csv or ndjson' },
        { status: 400 }
      );
    }

    // TODO: Add authentication check here
    // const user = await getCurrentUser(request);
    // if (!user || !hasAdminRole(user)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // TODO: In real implementation, fetch from database with streaming
    // For now, use mock data with pagination simulation
    let logs: AuditLog[] = mockAuditLogs;

    // Filter by tournament if specified
    if (tournamentId) {
      // In real implementation, this would be a database query
      logs = mockAuditLogs; // Mock data doesn't have tournamentId filtering
    }

    // Apply pagination
    const paginatedLogs = logs.slice(offset, offset + limit);

    // Set appropriate headers
    const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    const contentType = format === 'csv' ? 'text/csv' : 'application/x-ndjson';

    const headers = {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache',
    };

    // Create streaming response
    const encoder = new TextEncoder();

    // eslint-disable-next-line no-undef
    const stream = new ReadableStream({
      start(controller) {
        try {
          // Add header for CSV
          if (format === 'csv') {
            controller.enqueue(encoder.encode(getCsvHeader() + '\n'));
          }

          // Stream each log entry
          for (const log of paginatedLogs) {
            const line =
              format === 'csv'
                ? auditLogToCsvRow(log) + '\n'
                : auditLogToNdjsonLine(log) + '\n';

            controller.enqueue(encoder.encode(line));
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // TODO: Log the export event to audit trail
    // await logAuditEvent({
    //   type: 'EXPORT',
    //   actorId: user.id,
    //   actorType: 'user',
    //   message: `Exported ${paginatedLogs.length} audit logs in ${format} format`,
    //   details: { format, tournamentId, limit, offset },
    // });

    return new NextResponse(stream as any, { headers });
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle unsupported methods
 */
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
