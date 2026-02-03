import { FootballScraper, ScrapedFixture } from './football-scraper';
import { prisma } from '../prisma';
import * as cron from 'node-cron';

const scraper = new FootballScraper();

export class ScrapingService {
  private isRunning = false;
  private leagues = [
    'premier-league',
    'fa-cup',
    'carabao-cup',
    'champions-league',
    'la-liga',
    'bundesliga',
    'serie-a',
    'ligue-1',
  ];
  private cronJob: cron.ScheduledTask | null = null;

  async startScheduledScraping() {
    console.log('🚀 Starting scheduled scraping service...');

    // Schedule every 6 hours
    this.cronJob = cron.schedule('0 */6 * * *', async () => {
      console.log('⏰ Scheduled scrape triggered');
      if (!this.isRunning) {
        await this.scrapeAllLeagues();
      }
    });

    // Also run immediately on start
    await this.scrapeAllLeagues();
    
    console.log('✅ Scraping service started - will run every 6 hours');
  }

  stopScheduledScraping() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('🛑 Scraping service stopped');
    }
  }

  async scrapeAllLeagues() {
    if (this.isRunning) {
      console.log('⚠️  Scraping already in progress...');
      return { success: false, message: 'Already scraping' };
    }

    this.isRunning = true;
    console.log('🔄 Starting league scraping...');

    const results: Record<string, number> = {};

    try {
      for (const league of this.leagues) {
        console.log(`\n📊 Scraping ${league}...`);
        const fixtures = await scraper.scrapeAllFixtures(league);
        
        if (fixtures.length > 0) {
          const saved = await this.saveFixtures(fixtures, league);
          results[league] = saved;
          console.log(`✅ ${league}: Saved ${saved}/${fixtures.length} fixtures`);
        } else {
          console.log(`⚠️  ${league}: No fixtures found`);
          results[league] = 0;
        }

        // Delay to avoid rate limiting
        await this.delay(3000);
      }
      
      const total = Object.values(results).reduce((a, b) => a + b, 0);
      console.log(`\n🎯 Scraping complete! Total fixtures saved: ${total}`);
      
      return { 
        success: true, 
        message: `Saved ${total} fixtures`,
        details: results 
      };
    } catch (error) {
      console.error('❌ Scraping failed:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error',
        details: results 
      };
    } finally {
      this.isRunning = false;
    }
  }

  async scrapeSingleLeague(league: string): Promise<number> {
    console.log(`📊 Scraping single league: ${league}`);
    const fixtures = await scraper.scrapeAllFixtures(league);
    
    if (fixtures.length > 0) {
      return await this.saveFixtures(fixtures, league);
    }
    
    return 0;
  }

  private async saveFixtures(fixtures: ScrapedFixture[], league: string): Promise<number> {
    let savedCount = 0;

    for (const fixture of fixtures) {
      try {
        const kickoffDate = new Date(fixture.kickoff);
        const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000);
        
        // Skip invalid dates or past fixtures
        if (isNaN(kickoffDate.getTime()) || kickoffDate < cutoff) {
          continue;
        }

        // Check if fixture already exists (by teams and date)
        const existing = await prisma.fixture.findFirst({
          where: {
            homeTeam: fixture.homeTeam,
            awayTeam: fixture.awayTeam,
            kickoff: {
              gte: new Date(kickoffDate.getTime() - 3600000), // 1 hour before
              lte: new Date(kickoffDate.getTime() + 3600000), // 1 hour after
            },
          },
        });

        if (!existing) {
          await prisma.fixture.create({
            data: {
              homeTeam: fixture.homeTeam,
              awayTeam: fixture.awayTeam,
              competition: fixture.competition,
              kickoff: kickoffDate,
              status: fixture.status || 'SCHEDULED',
              venue: fixture.venue,
              source: 'web-scraper',
              scrapedAt: new Date(),
            },
          });
          savedCount++;
        } else {
          // Update existing fixture
          await prisma.fixture.update({
            where: { id: existing.id },
            data: {
              status: fixture.status || existing.status,
              scrapedAt: new Date(),
            },
          });
        }
      } catch (error) {
        console.error(`Failed to save fixture ${fixture.homeTeam} vs ${fixture.awayTeam}:`, error);
      }
    }

    return savedCount;
  }

  async getUpcomingFixtures(league: string, limit: number = 10) {
    const competitionName = this.mapLeagueName(league);
    const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000);
    
    const fixtures = await prisma.fixture.findMany({
      where: {
        competition: { contains: competitionName, mode: 'insensitive' },
        kickoff: { gt: cutoff },
        status: { in: ['SCHEDULED', 'TIMED', 'IN_PLAY'] },
      },
      orderBy: { kickoff: 'asc' },
      take: limit,
    });

    // If no fixtures in DB, try to scrape fresh
    if (fixtures.length === 0) {
      console.log(`No fixtures in DB for ${league}, attempting fresh scrape...`);
      await this.scrapeSingleLeague(league);
      
      // Try again after scraping
      return await prisma.fixture.findMany({
        where: {
          competition: { contains: competitionName, mode: 'insensitive' },
          kickoff: { gt: cutoff },
          status: { in: ['SCHEDULED', 'TIMED', 'IN_PLAY'] },
        },
        orderBy: { kickoff: 'asc' },
        take: limit,
      });
    }

    return fixtures;
  }

  async getFixtureStats() {
    const total = await prisma.fixture.count();
    const upcoming = await prisma.fixture.count({
      where: {
        kickoff: { gt: new Date() },
        status: 'SCHEDULED',
      },
    });
    const byCompetition = await prisma.fixture.groupBy({
      by: ['competition'],
      _count: true,
      where: {
        kickoff: { gt: new Date() },
      },
    });

    return {
      total,
      upcoming,
      byCompetition: byCompetition.map((c: { competition: string; _count: number }) => ({
        competition: c.competition,
        count: c._count,
      })),
    };
  }

  async cleanOldFixtures() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const deleted = await prisma.fixture.deleteMany({
      where: {
        kickoff: { lt: oneWeekAgo },
      },
    });

    console.log(`🗑️  Cleaned ${deleted.count} old fixtures`);
    return deleted.count;
  }

  private mapLeagueName(slug: string): string {
    const mapping: Record<string, string> = {
      'premier-league': 'Premier League',
      'fa-cup': 'FA Cup',
      'carabao-cup': 'Carabao Cup',
      'la-liga': 'La Liga',
      'bundesliga': 'Bundesliga',
      'serie-a': 'Serie A',
      'ligue-1': 'Ligue 1',
      'champions-league': 'Champions League',
      'europa-league': 'Europa League',
    };
    return mapping[slug] || slug;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let scrapingServiceInstance: ScrapingService | null = null;

export function getScrapingService(): ScrapingService {
  if (!scrapingServiceInstance) {
    scrapingServiceInstance = new ScrapingService();
  }
  return scrapingServiceInstance;
}
