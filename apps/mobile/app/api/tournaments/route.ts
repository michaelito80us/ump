import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for demo purposes
const tournaments: any[] = [];

export async function GET() {
  return NextResponse.json({ tournaments });
}

export async function POST(request: NextRequest) {
  try {
    const tournament = await request.json();

    // Add timestamp and ID
    const newTournament = {
      ...tournament,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      synced: true,
    };

    tournaments.push(newTournament);

    return NextResponse.json({
      success: true,
      tournament: newTournament,
    });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create tournament' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const tournament = await request.json();

    // For demo purposes, just return success
    return NextResponse.json({
      success: true,
      message: 'Tournament synced successfully',
      tournament,
    });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: 'Failed to sync tournament' },
      { status: 500 }
    );
  }
}
