import { NextRequest, NextResponse } from 'next/server';
import { fetchUpcomingFixtures, LEAGUE_CODES, LeagueSlug } from '@/lib/football-data';
import { getScrapingService } from '@/lib/scrapers/scraping-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const league = searchParams.get('league') as LeagueSlug | null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const days = parseInt(searchParams.get('days') || '', 10);
    const hasDaysWindow = Number.isFinite(days) && days > 0;
    const cutoffDate = hasDaysWindow ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;
    const source = searchParams.get('source'); // 'api', 'scraper', or 'auto'

    if (!league || !LEAGUE_CODES[league]) {
      return NextResponse.json(
        {
          error: 'Invalid or missing league parameter',
          availableLeagues: Object.keys(LEAGUE_CODES),
        },
        { status: 400 }
      );
    }

    // Try web scraper first (primary source)
    if (!source || source === 'auto' || source === 'scraper') {
      try {
        const scrapingService = getScrapingService();
        const scrapedFixtures = await scrapingService.getUpcomingFixtures(league, limit);

        const filteredScrapedFixtures = hasDaysWindow
          ? scrapedFixtures.filter((f) => f.kickoff <= (cutoffDate as Date))
          : scrapedFixtures;

        if (filteredScrapedFixtures.length > 0) {
          // Convert to FootballFixture format
          const fixtures = filteredScrapedFixtures.map((f, index) => ({
            id: index + 1,
            homeTeam: f.homeTeam,
            awayTeam: f.awayTeam,
            competition: f.competition,
            competitionCode: LEAGUE_CODES[league].code,
            kickoff: f.kickoff.toISOString(),
            status: f.status,
            venue: f.venue,
            odds: undefined, // Scraper doesn't get odds yet
          }));

          return NextResponse.json(
            {
              success: true,
              league,
              leagueInfo: LEAGUE_CODES[league],
              count: fixtures.length,
              fixtures,
              source: 'web-scraper',
              lastScraped: scrapedFixtures[0]?.scrapedAt,
            },
            {
              headers: {
                'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
              },
            }
          );
        }
      } catch (scraperError) {
        console.error('Scraper failed, falling back to API:', scraperError);
      }
    }

    // Fallback to football-data.org API
    if (!source || source === 'auto' || source === 'api') {
      const fixtures = await fetchUpcomingFixtures(league, limit);
      const filteredFixtures = hasDaysWindow
        ? fixtures.filter((f) => new Date(f.kickoff) <= (cutoffDate as Date))
        : fixtures;

      return NextResponse.json(
        {
          success: true,
          league,
          leagueInfo: LEAGUE_CODES[league],
          count: filteredFixtures.length,
          fixtures: filteredFixtures,
          source: filteredFixtures.length > 0 && filteredFixtures[0].id ? 'football-data-api' : 'static-fallback',
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        }
      );
    }

    return NextResponse.json(
      { error: 'Invalid source parameter' },
      { status: 400 }
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
