import { NextRequest, NextResponse } from 'next/server';
import { getScrapingService } from '@/lib/scrapers/scraping-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const league = searchParams.get('league');

  const scrapingService = getScrapingService();

  try {
    if (action === 'force') {
      // Force scrape all leagues
      const result = await scrapingService.scrapeAllLeagues();
      return NextResponse.json(result);
      
    } else if (action === 'stats') {
      // Get scraping statistics
      const stats = await scrapingService.getFixtureStats();
      return NextResponse.json({ success: true, stats });
      
    } else if (action === 'clean') {
      // Clean old fixtures
      const count = await scrapingService.cleanOldFixtures();
      return NextResponse.json({ 
        success: true, 
        message: `Cleaned ${count} old fixtures` 
      });
      
    } else if (league) {
      // Scrape specific league
      const count = await scrapingService.scrapeSingleLeague(league);
      return NextResponse.json({ 
        success: true, 
        message: `Saved ${count} fixtures for ${league}`,
        count 
      });
      
    } else {
      return NextResponse.json({
        success: false,
        error: 'Specify action (force|stats|clean) or league parameter',
        examples: [
          '/api/scrape?action=force',
          '/api/scrape?action=stats',
          '/api/scrape?action=clean',
          '/api/scrape?league=premier-league',
        ],
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Scrape API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
