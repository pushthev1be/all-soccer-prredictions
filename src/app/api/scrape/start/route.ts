import { NextResponse } from 'next/server';
import { getScrapingService } from '@/lib/scrapers/scraping-service';

let isStarted = false;

export async function GET() {
  try {
    if (!isStarted) {
      const scrapingService = getScrapingService();
      
      // Start in background - don't wait for completion
      scrapingService.startScheduledScraping().catch(console.error);
      isStarted = true;
      
      return NextResponse.json({ 
        success: true, 
        message: 'Scraping service started - will run every 6 hours',
        status: 'initialized'
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Scraping service already running',
      status: 'running'
    });
  } catch (error) {
    console.error('Failed to start scraping service:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
