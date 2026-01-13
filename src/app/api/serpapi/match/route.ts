import { NextResponse } from 'next/server';
import { serpApiSports } from '@/lib/serpapi-sports';

/**
 * GET /api/serpapi/match
 * 
 * Fetch specific match data from SerpAPI
 * Query params:
 * - query: Match query (e.g., "Manchester United vs Liverpool")
 * - live: Set to "true" to get live match data
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const isLive = searchParams.get('live') === 'true';

    if (!query) {
      return NextResponse.json(
        { error: 'Missing required parameter: query' },
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

    const matchData = isLive 
      ? await serpApiSports.getLiveMatch(query)
      : await serpApiSports.getMatchResult(query);

    if (!matchData) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Try to get highlights
    const highlights = await serpApiSports.getMatchHighlights(query);

    return NextResponse.json({
      success: true,
      match: matchData,
      highlights,
    });
  } catch (error) {
    console.error('SerpAPI match error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch match data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
