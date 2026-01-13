import { NextResponse } from 'next/server';
import { serpApiSports } from '@/lib/serpapi-sports';

/**
 * GET /api/serpapi/fixtures
 * 
 * Fetch upcoming fixtures from SerpAPI
 * Query params:
 * - team: Team name (e.g., "Manchester United F.C.")
 * - competition: Competition name (e.g., "Premier League")
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const team = searchParams.get('team');
    const competition = searchParams.get('competition');

    if (!serpApiSports.isConfigured()) {
      return NextResponse.json(
        { 
          error: 'SerpAPI not configured',
          message: 'Please set SERPAPI_API_KEY environment variable' 
        },
        { status: 503 }
      );
    }

    let fixtures = [];

    if (team) {
      fixtures = await serpApiSports.getUpcomingFixtures(team);
    } else if (competition) {
      fixtures = await serpApiSports.getCompetitionFixtures(competition);
    } else {
      return NextResponse.json(
        { error: 'Missing required parameter: team or competition' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      count: fixtures.length,
      fixtures,
    });
  } catch (error) {
    console.error('SerpAPI fixtures error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch fixtures',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
