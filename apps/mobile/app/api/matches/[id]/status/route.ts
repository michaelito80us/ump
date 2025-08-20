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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status, homeTeamScore, awayTeamScore } = await request.json();

    // Find the match
    const matchIndex = matches.findIndex(m => m.id === id);
    if (matchIndex === -1) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
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
      success: true,
      match: matches[matchIndex]
    });
  } catch (error) {
    console.error('Failed to update match status:', error);
    return NextResponse.json(
      { error: 'Failed to update match status' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const match = matches.find(m => m.id === id);
    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ match });
  } catch (error) {
    console.error('Failed to get match:', error);
    return NextResponse.json(
      { error: 'Failed to get match' },
      { status: 500 }
    );
  }
}