import { NextResponse } from 'next/server';
import { serpApiSports } from '@/lib/serpapi-sports';

/**
 * GET /api/serpapi/team
 * 
 * Fetch team data from SerpAPI (recent results, upcoming fixtures, rankings)
 * Query params:
 * - name: Team name (e.g., "Manchester United F.C.")
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamName = searchParams.get('name');

    if (!teamName) {
      return NextResponse.json(
        { error: 'Missing required parameter: name' },
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

    const [teamResults, upcomingFixtures, recentResults] = await Promise.all([
      serpApiSports.getTeamResults(teamName),
      serpApiSports.getUpcomingFixtures(teamName),
      serpApiSports.getRecentResults(teamName),
    ]);

    if (!teamResults) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      team: {
        title: teamResults.title,
        rankings: teamResults.rankings,
        thumbnail: teamResults.thumbnail,
        upcomingFixtures,
        recentResults,
        gameSpotlight: teamResults.game_spotlight,
      },
    });
  } catch (error) {
    console.error('SerpAPI team error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch team data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
