import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveOdds } from '@/lib/odds-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const homeTeam = searchParams.get('homeTeam');
    const awayTeam = searchParams.get('awayTeam');
    const competitionId = searchParams.get('competitionId') ?? undefined;
    const market = searchParams.get('market') ?? 'h2h';
    const bookmakers = searchParams.get('bookmakers')?.split(',') ?? undefined;

    if (!homeTeam || !awayTeam) {
      return NextResponse.json(
        { error: 'homeTeam and awayTeam are required' },
        { status: 400 }
      );
    }

    const odds = await fetchLiveOdds({
      homeTeam,
      awayTeam,
      competitionId,
      kickoffTime: searchParams.get('kickoff') || undefined,
      market,
      bookmakers,
    });

    if (!odds) {
      return NextResponse.json(
        { 
          error: 'No live odds found for this fixture',
          query: {
            homeTeam,
            awayTeam,
            competitionId,
            market,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, odds },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('❌ Error in GET /api/odds:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
