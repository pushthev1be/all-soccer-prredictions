import { NextResponse } from 'next/server';
import { serpApiSports } from '@/lib/serpapi-sports';

/**
 * GET /api/serpapi/standings
 * 
 * Fetch league standings from SerpAPI
 * Query params:
 * - league: League name (e.g., "Premier League", "La Liga")
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const league = searchParams.get('league');

    if (!league) {
      return NextResponse.json(
        { error: 'Missing required parameter: league' },
        { status: 400 }
      );
    }

    if (!serpApiSports.isConfigured()) {
      return NextResponse.json(
        { 
          error: 'SerpAPI not configured',
          message: 'Please set SERPAPI_API_KEY environment variable' 
        },
        { status: 503 }
      );
    }

    const standings = await serpApiSports.getLeagueStandings(league);

    if (!standings) {
      return NextResponse.json(
        { error: 'No standings found for this league' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      standings,
    });
  } catch (error) {
    console.error('SerpAPI standings error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch standings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
