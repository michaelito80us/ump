import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for demo purposes
interface Match {
  id: string;
  status: 'PENDING' | 'LIVE' | 'COMPLETED';
  homeTeam: {
    id: string;
    name: string;
    score: number;
  };
  awayTeam: {
    id: string;
    name: string;
    score: number;
  };
  updatedAt: string;
}

// Mock matches data
const matches: Match[] = [
  {
    id: '1',
    status: 'PENDING',
    homeTeam: { id: '1', name: 'Fire Dragons', score: 0 },
    awayTeam: { id: '2', name: 'Thunder Bolts', score: 0 },
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    status: 'LIVE',
    homeTeam: { id: '3', name: 'Storm Eagles', score: 45 },
    awayTeam: { id: '4', name: 'Lightning Wolves', score: 42 },
    updatedAt: new Date().toISOString()
  }
];

export async function POST(request: NextRequest) {
  try {
    const { operationName, variables } = await request.json();

    if (operationName === 'UpdateMatchStatus') {
      const { matchId, status, homeTeamScore, awayTeamScore } = variables;

      // Find the match
      const matchIndex = matches.findIndex(m => m.id === matchId);
      if (matchIndex === -1) {
        return NextResponse.json({
          errors: [{ message: 'Match not found' }]
        }, { status: 404 });
      }

      // Update match status and scores
      matches[matchIndex] = {
        ...matches[matchIndex],
        status,
        homeTeam: {
          ...matches[matchIndex].homeTeam,
          score: homeTeamScore ?? matches[matchIndex].homeTeam.score
        },
        awayTeam: {
          ...matches[matchIndex].awayTeam,
          score: awayTeamScore ?? matches[matchIndex].awayTeam.score
        },
        updatedAt: new Date().toISOString()
      };

      return NextResponse.json({
        data: {
          updateMatchStatus: {
            id: matches[matchIndex].id,
            status: matches[matchIndex].status,
            homeTeam: {
              score: matches[matchIndex].homeTeam.score
            },
            awayTeam: {
              score: matches[matchIndex].awayTeam.score
            }
          }
        }
      });
    }

    if (operationName === 'GetMatches') {
      return NextResponse.json({
        data: {
          matches: matches.map(match => ({
            id: match.id,
            status: match.status,
            teamA: match.homeTeam,
            teamB: match.awayTeam,
            scoreA: match.homeTeam.score,
            scoreB: match.awayTeam.score,
            startedAt: match.updatedAt
          }))
        }
      });
    }

    // Default response for unknown operations
    return NextResponse.json({
      errors: [{ message: `Unknown operation: ${operationName}` }]
    }, { status: 400 });

  } catch (error) {
    console.error('GraphQL API error:', error);
    return NextResponse.json({
      errors: [{ message: 'Internal server error' }]
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'GraphQL endpoint is available. Use POST for queries and mutations.'
  });
}