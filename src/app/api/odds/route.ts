import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveOdds } from '@/lib/odds-api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeTeam = searchParams.get('homeTeam');
  const awayTeam = searchParams.get('awayTeam');
  const competitionId = searchParams.get('competitionId') ?? undefined;

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
  });

  if (!odds) {
    return NextResponse.json(
      { error: 'No live odds found for this fixture' },
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
}
