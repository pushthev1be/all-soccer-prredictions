/**
 * SerpAPI Sports Results Integration
 * 
 * This module provides integration with SerpAPI's Google Sports Results API
 * to fetch real-time soccer data including:
 * - Team standings and rankings
 * - Upcoming fixtures and live matches
 * - Match results and scores
 * - Player statistics
 * - Video highlights
 */

interface SerpAPIConfig {
  apiKey: string;
  baseUrl: string;
}

interface TeamInfo {
  name: string;
  thumbnail?: string;
  score?: string;
  kgmid?: string;
}

interface GameInfo {
  tournament: string;
  stage?: string;
  stadium?: string;
  status: string;
  date: string;
  time?: string;
  teams: TeamInfo[];
  video_highlights?: {
    link: string;
    thumbnail: string;
    duration: string;
  };
}

interface SportsResults {
  title: string;
  rankings?: string;
  thumbnail?: string;
  games?: GameInfo[];
  game_spotlight?: {
    league: string;
    stadium?: string;
    date: string;
    stage?: string;
    status: string;
    teams: TeamInfo[];
  };
}

interface StandingsTeam {
  team: {
    name: string;
    thumbnail: string;
  };
  pos: string;
  mp: string;
  w: string;
  d: string;
  l: string;
  gf: string;
  ga: string;
  gd: string;
  pts: string;
  last_5?: string[];
}

interface StandingsResults {
  title: string;
  season: string;
  round: string;
  league: {
    standings: StandingsTeam[];
  };
}

class SerpAPISportsService {
  private config: SerpAPIConfig;

  constructor() {
    this.config = {
      apiKey: process.env.SERPAPI_API_KEY || '',
      baseUrl: 'https://serpapi.com/search.json',
    };

    if (!this.config.apiKey) {
      console.warn('⚠️ SERPAPI_API_KEY not configured. SerpAPI features will be disabled.');
    }
  }

  /**
   * Check if SerpAPI is configured
   */
  isConfigured(): boolean {
    return Boolean(this.config.apiKey);
  }

  /**
   * Make a request to SerpAPI with caching and optimization
   */
  private async makeRequest(params: Record<string, string>, useCache = true): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('SerpAPI is not configured. Please set SERPAPI_API_KEY environment variable.');
    }

    const queryParams = new URLSearchParams({
      ...params,
      api_key: this.config.apiKey,
      engine: 'google',
      // FREE cache for 1 hour
      no_cache: useCache ? 'false' : 'true',
      // Optimize JSON response size
      json_restrictor: 'sports_results,title,rankings,games,game_spotlight',
      // Consistent location
      hl: 'en',
      gl: 'us',
    });

    const url = `${this.config.baseUrl}?${queryParams.toString()}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        const statusCode = response.status;
        const statusText = response.statusText;
        
        // Handle quota exhaustion gracefully
        if (statusCode === 429 || statusCode === 403) {
          console.error(`⚠️ SerpAPI quota/rate limit error [${statusCode}]: ${statusText}`);
          return null; // Return null instead of throwing to allow fallback
        }
        
        throw new Error(`SerpAPI request failed: ${statusCode} ${statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('SerpAPI request error:', error);
      return null; // Return null to allow graceful fallback
    }
  }

  /**
   * Get team sports results (fixtures, scores, highlights)
   * Uses exact match for better accuracy
   */
  async getTeamResults(teamName: string, location: string = 'United States'): Promise<SportsResults | null> {
    try {
      const data = await this.makeRequest({
        q: `"${teamName}"`, // Exact match with quotes
        location,
      });

      if (data?.sports_results) {
        console.log(`✓ Sports data for ${teamName}: ${data.sports_results.games?.length || 0} games found`);
      }

      return data.sports_results || null;
    } catch (error) {
      console.error(`Failed to get team results for ${teamName}:`, error);
      return null;
    }
  }

  /**
   * Get upcoming fixtures for a team
   */
  async getUpcomingFixtures(teamName: string): Promise<GameInfo[]> {
    const results = await this.getTeamResults(teamName);
    
    if (!results || !results.games) {
      return [];
    }

    // Filter for upcoming games (no score yet)
    return results.games.filter(game => 
      !game.status || game.status.toLowerCase().includes('tbd') || !game.teams.some(t => t.score)
    );
  }

  /**
   * Get recent results for a team
   */
  async getRecentResults(teamName: string): Promise<GameInfo[]> {
    const results = await this.getTeamResults(teamName);
    
    if (!results || !results.games) {
      return [];
    }

    // Filter for completed games (has scores)
    return results.games.filter(game => 
      game.status && (game.status.toLowerCase() === 'ft' || game.status.toLowerCase() === 'final')
    );
  }

  /**
   * Get specific match result
   * Example: "Manchester United vs Liverpool"
   */
  async getMatchResult(matchQuery: string, location: string = 'austin, texas, united states'): Promise<SportsResults | null> {
    try {
      const data = await this.makeRequest({
        q: matchQuery,
        location,
      });

      return data.sports_results || null;
    } catch (error) {
      console.error(`Failed to get match result for ${matchQuery}:`, error);
      return null;
    }
  }

  /**
   * Get league standings
   * Example: "Premier League standings" or "La Liga standings"
   */
  async getLeagueStandings(league: string, location: string = 'austin, texas, united states'): Promise<StandingsResults | null> {
    try {
      const query = `${league} standings`;
      const data = await this.makeRequest({
        q: query,
        location,
      });

      return data.sports_results || null;
    } catch (error) {
      console.error(`Failed to get standings for ${league}:`, error);
      return null;
    }
  }

  /**
   * Get live match data
   * Example: "Manchester United vs Liverpool live"
   */
  async getLiveMatch(matchQuery: string): Promise<SportsResults | null> {
    try {
      const data = await this.makeRequest({
        q: `${matchQuery} live`,
        location: 'austin, texas, united states',
      });

      return data.sports_results || null;
    } catch (error) {
      console.error(`Failed to get live match data for ${matchQuery}:`, error);
      return null;
    }
  }

  /**
   * Get player statistics
   * Example: "Lionel Messi stats" or "Erling Haaland stats"
   */
  async getPlayerStats(playerName: string): Promise<any> {
    try {
      const data = await this.makeRequest({
        q: `${playerName} stats`,
        location: 'austin, texas, united states',
      });

      return data.sports_results || null;
    } catch (error) {
      console.error(`Failed to get player stats for ${playerName}:`, error);
      return null;
    }
  }

  /**
   * Search for fixtures by competition
   * Example: "Premier League fixtures", "Champions League fixtures"
   */
  async getCompetitionFixtures(competition: string): Promise<GameInfo[]> {
    try {
      const data = await this.makeRequest({
        q: `${competition} fixtures`,
        location: 'austin, texas, united states',
      });

      const sportsResults = data.sports_results;
      if (!sportsResults) {
        return [];
      }

      return sportsResults.games || [];
    } catch (error) {
      console.error(`Failed to get fixtures for ${competition}:`, error);
      return [];
    }
  }

  /**
   * Get match highlights video
   */
  async getMatchHighlights(matchQuery: string): Promise<{ link: string; thumbnail: string; duration: string } | null> {
    const results = await this.getMatchResult(matchQuery);
    
    if (!results) {
      return null;
    }

    // Check game spotlight for highlights
    if (results.game_spotlight && 'video_highlight_carousel' in results.game_spotlight) {
      const carousel = (results.game_spotlight as any).video_highlight_carousel;
      if (carousel && carousel.length > 0) {
        return carousel[0];
      }
    }

    // Check games array for highlights
    if (results.games && results.games.length > 0) {
      for (const game of results.games) {
        if (game.video_highlights) {
          return game.video_highlights;
        }
      }
    }

    return null;
  }
}

// Export singleton instance
export const serpApiSports = new SerpAPISportsService();

// Export types
export type {
  SportsResults,
  GameInfo,
  TeamInfo,
  StandingsResults,
  StandingsTeam,
};
