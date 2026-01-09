import { NextRequest, NextResponse } from 'next/server';
import { fetchUpcomingFixtures, LEAGUE_CODES, LeagueSlug } from '@/lib/football-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const league = searchParams.get('league') as LeagueSlug | null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

    if (!league || !LEAGUE_CODES[league]) {
      return NextResponse.json(
        {
          error: 'Invalid or missing league parameter',
          availableLeagues: Object.keys(LEAGUE_CODES),
        },
        { status: 400 }
      );
    }

    const fixtures = await fetchUpcomingFixtures(league, limit);

    return NextResponse.json(
      {
        success: true,
        league,
        leagueInfo: LEAGUE_CODES[league],
        count: fixtures.length,
        fixtures,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error('Error in fixtures API route:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch fixtures',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
