import * as cheerio from 'cheerio';
import axios from 'axios';

export interface ScrapedFixture {
  homeTeam: string;
  awayTeam: string;
  competition: string;
  kickoff: string;
  venue?: string;
  status?: string;
}

export interface ScrapedResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  competition: string;
  date: string;
}

export class FootballScraper {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];

  private currentAgentIndex = 0;

  // BBC Sport - Premier League Fixtures
  async scrapeBBCFixtures(competition: string = 'premier-league'): Promise<ScrapedFixture[]> {
    const urls: Record<string, string> = {
      'premier-league': 'https://www.bbc.com/sport/football/premier-league/scores-fixtures',
      'champions-league': 'https://www.bbc.com/sport/football/champions-league/scores-fixtures',
      'la-liga': 'https://www.bbc.com/sport/football/spanish-la-liga/scores-fixtures',
      'bundesliga': 'https://www.bbc.com/sport/football/german-bundesliga/scores-fixtures',
      'serie-a': 'https://www.bbc.com/sport/football/italian-serie-a/scores-fixtures',
      'ligue-1': 'https://www.bbc.com/sport/football/french-ligue-one/scores-fixtures',
    };

    const url = urls[competition] || urls['premier-league'];
    
    try {
      console.log(`🔍 Scraping BBC Sport: ${competition}`);
      
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': this.rotateUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(data);
      const fixtures: ScrapedFixture[] = [];

      // BBC Sport uses specific data attributes for fixtures
      $('article.sp-c-fixture, div.sp-c-fixture').each((_, element) => {
        try {
          const $el = $(element);
          
          // Try multiple selectors for team names
          let homeTeam = $el.find('.sp-c-fixture__team--home .sp-c-fixture__team-name-trunc, .sp-c-fixture__team--home .qa-full-team-name').first().text().trim();
          let awayTeam = $el.find('.sp-c-fixture__team--away .sp-c-fixture__team-name-trunc, .sp-c-fixture__team--away .qa-full-team-name').first().text().trim();
          
          // Fallback to abbr if full name not found
          if (!homeTeam) {
            homeTeam = $el.find('.sp-c-fixture__team--home abbr').attr('title') || '';
          }
          if (!awayTeam) {
            awayTeam = $el.find('.sp-c-fixture__team--away abbr').attr('title') || '';
          }

          // Get date/time
          const dateStr = $el.find('.sp-c-fixture__date, time').first().text().trim();
          const timeStr = $el.find('.sp-c-fixture__number--time').first().text().trim();
          
          // Get status
          const statusText = $el.find('.sp-c-fixture__status-wrapper').text().trim();
          const isFinished = statusText.toLowerCase().includes('ft') || statusText.toLowerCase().includes('full-time');
          
          if (homeTeam && awayTeam && !isFinished) {
            fixtures.push({
              homeTeam: this.cleanTeamName(homeTeam),
              awayTeam: this.cleanTeamName(awayTeam),
              competition: this.mapCompetitionName(competition),
              kickoff: this.parseDate(dateStr, timeStr),
              status: 'SCHEDULED',
              venue: `${this.cleanTeamName(homeTeam)} Stadium`
            });
          }
        } catch (err) {
          console.error('Error parsing fixture element:', err);
        }
      });

      console.log(`✅ BBC scraped ${fixtures.length} fixtures for ${competition}`);
      return fixtures.slice(0, 20); // Limit to 20 fixtures
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`BBC Scraper failed for ${competition}: ${error.message}`);
      } else {
        console.error(`BBC Scraper failed for ${competition}:`, error);
      }
      return [];
    }
  }

  // ESPN Fixtures (Backup)
  async scrapeESPNFixtures(competition: string = 'eng.1'): Promise<ScrapedFixture[]> {
    try {
      console.log(`🔍 Scraping ESPN: ${competition}`);
      
      const { data } = await axios.get(`https://www.espn.com/soccer/fixtures/_/league/${competition}`, {
        headers: {
          'User-Agent': this.rotateUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(data);
      const fixtures: ScrapedFixture[] = [];

      $('.Table__TR').each((_, element) => {
        try {
          const $el = $(element);
          const teams = $el.find('.Table__Team a').map((_, teamEl) => $(teamEl).text().trim()).get();
          
          if (teams.length >= 2) {
            const dateStr = $el.find('.Table__TD .date').text().trim();
            const timeStr = $el.find('.Table__TD .time').text().trim();

            fixtures.push({
              homeTeam: this.cleanTeamName(teams[0]),
              awayTeam: this.cleanTeamName(teams[1]),
              competition: this.mapESPNCompetition(competition),
              kickoff: this.parseDate(dateStr, timeStr),
              status: 'SCHEDULED'
            });
          }
        } catch (err) {
          console.error('Error parsing ESPN fixture:', err);
        }
      });

      console.log(`✅ ESPN scraped ${fixtures.length} fixtures`);
      return fixtures;
    } catch (error) {
      console.error('ESPN Scraper failed:', error);
      return [];
    }
  }

  // Multiple Source Aggregator with deduplication
  async scrapeAllFixtures(competition: string): Promise<ScrapedFixture[]> {
    const sources = [
      () => this.scrapeBBCFixtures(competition),
      // Add more sources here as needed
    ];

    const results = await Promise.allSettled(sources.map(source => source()));
    
    // Combine and deduplicate results
    const allFixtures: ScrapedFixture[] = [];
    const seen = new Set<string>();

    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const fixture of result.value) {
          // Create unique key for deduplication
          const key = `${this.normalizeTeamName(fixture.homeTeam)}-${this.normalizeTeamName(fixture.awayTeam)}-${new Date(fixture.kickoff).toDateString()}`;
          
          if (!seen.has(key)) {
            seen.add(key);
            allFixtures.push(fixture);
          }
        }
      }
    }

    return allFixtures;
  }

  private rotateUserAgent(): string {
    this.currentAgentIndex = (this.currentAgentIndex + 1) % this.userAgents.length;
    return this.userAgents[this.currentAgentIndex];
  }

  private cleanTeamName(name: string): string {
    return name
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '')
      .replace(/\(.*?\)/g, '') // Remove parentheses content
      .trim();
  }

  private normalizeTeamName(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  private mapCompetitionName(urlSegment: string): string {
    const mapping: Record<string, string> = {
      'premier-league': 'Premier League',
      'champions-league': 'UEFA Champions League',
      'la-liga': 'La Liga',
      'bundesliga': 'Bundesliga',
      'serie-a': 'Serie A',
      'ligue-1': 'Ligue 1',
    };
    return mapping[urlSegment] || urlSegment;
  }

  private mapESPNCompetition(code: string): string {
    const mapping: Record<string, string> = {
      'eng.1': 'Premier League',
      'esp.1': 'La Liga',
      'ger.1': 'Bundesliga',
      'ita.1': 'Serie A',
      'fra.1': 'Ligue 1',
      'uefa.champions': 'UEFA Champions League',
    };
    return mapping[code] || 'Various';
  }

  private parseDate(dateStr: string, timeStr?: string): string {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Handle relative dates
      if (dateStr.toLowerCase().includes('today')) {
        return this.setTime(today, timeStr).toISOString();
      } else if (dateStr.toLowerCase().includes('tomorrow')) {
        return this.setTime(tomorrow, timeStr).toISOString();
      }

      // Try to parse specific date formats
      // BBC format: "Sat 11 Jan" or "11 Jan"
      const dateMatch = dateStr.match(/(\d{1,2})\s+(\w{3})/);
      if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const monthStr = dateMatch[2];
        const month = this.parseMonth(monthStr);
        
        const year = today.getFullYear();
        const parsedDate = new Date(year, month, day);
        
        // If date is in the past, assume next year
        if (parsedDate < today) {
          parsedDate.setFullYear(year + 1);
        }
        
        return this.setTime(parsedDate, timeStr).toISOString();
      }

      // Fallback: return date 3 days from now
      const fallback = new Date(today);
      fallback.setDate(fallback.getDate() + 3);
      return fallback.toISOString();
    } catch (error) {
      console.error('Error parsing date:', dateStr, error);
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 3);
      return fallback.toISOString();
    }
  }

  private setTime(date: Date, timeStr?: string): Date {
    if (!timeStr) {
      date.setHours(15, 0, 0, 0); // Default to 3 PM
      return date;
    }

    try {
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        date.setHours(hours, minutes, 0, 0);
      }
    } catch (error) {
      console.error('Error parsing time:', timeStr, error);
    }

    return date;
  }

  private parseMonth(monthStr: string): number {
    const months: Record<string, number> = {
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3,
      'may': 4, 'jun': 5, 'jul': 6, 'aug': 7,
      'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };
    return months[monthStr.toLowerCase()] || 0;
  }
}
