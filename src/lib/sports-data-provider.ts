import axios from 'axios';

export interface TeamFormData {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  matchesPlayed: number;
  lastFiveResults: ('W' | 'D' | 'L')[];
}

export interface HeadToHeadData {
  matches: number;
  homeWins: number;
  awayWins: number;
  draws: number;
  avgHomeGoals: number;
  avgAwayGoals: number;
  lastMeetings: Array<{
    date: string;
    score: string;
    winner: 'home' | 'away' | 'draw';
  }>;
}

export interface InjuryReport {
  playerName: string;
  position: string;
  expectedReturn?: string;
  severity: 'minor' | 'moderate' | 'severe';
}

export interface OddsData {
  homeWin: number;
  draw: number;
  awayWin: number;
  bookmaker: string;
  market: string;
  lastUpdated: string;
}

export interface FixtureData {
  fixtureId: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  venue?: string;
  referee?: string;
  weather?: {
    temperature?: number;
    conditions?: string;
    windSpeed?: number;
  };
  homeForm?: TeamFormData;
  awayForm?: TeamFormData;
  headToHead?: HeadToHeadData;
  homeInjuries?: InjuryReport[];
  awayInjuries?: InjuryReport[];
  odds?: OddsData[];
}

export class SportsDataProvider {
  private apiKey: string;
  private baseUrl: string;
  private enableRealData: boolean;

  constructor() {
    this.apiKey = process.env.SPORTS_API_KEY || '';
    this.baseUrl = process.env.SPORTS_API_BASE_URL || 'https://api.api-football.com/v3';
    this.enableRealData = process.env.ENABLE_REAL_SPORTS_DATA === 'true';
  }

  private get headers() {
    return {
      'x-rapidapi-key': this.apiKey,
      'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
    };
  }

  async getFixtureData(
    canonicalCompetitionId: string,
    canonicalHomeTeamId: string,
    canonicalAwayTeamId: string,
    kickoffTime: Date
  ): Promise<FixtureData> {
    if (!this.enableRealData || !this.apiKey) {
      return this.getMockFixtureData(
        canonicalCompetitionId,
        canonicalHomeTeamId,
        canonicalAwayTeamId,
        kickoffTime
      );
    }

    try {
      // In production, map canonical IDs to provider-specific IDs
      // For now, return enhanced mock data
      return this.getMockFixtureData(
        canonicalCompetitionId,
        canonicalHomeTeamId,
        canonicalAwayTeamId,
        kickoffTime
      );
    } catch (error) {
      console.error('Error fetching fixture data:', error);
      return this.getMockFixtureData(
        canonicalCompetitionId,
        canonicalHomeTeamId,
        canonicalAwayTeamId,
        kickoffTime
      );
    }
  }

  private getMockFixtureData(
    canonicalCompetitionId: string,
    canonicalHomeTeamId: string,
    canonicalAwayTeamId: string,
    kickoffTime: Date
  ): FixtureData {
    const homeTeamName = this.formatTeamName(canonicalHomeTeamId);
    const awayTeamName = this.formatTeamName(canonicalAwayTeamId);
    const competitionName = this.formatCompetitionName(canonicalCompetitionId);

    return {
      fixtureId: `mock-${Date.now()}`,
      competition: competitionName,
      homeTeam: homeTeamName,
      awayTeam: awayTeamName,
      kickoff: kickoffTime.toISOString(),
      venue: `${homeTeamName} Stadium`,
      referee: 'M. Oliver',
      weather: {
        temperature: 18,
        conditions: 'Clear',
        windSpeed: 12,
      },
      homeForm: {
        wins: 7,
        draws: 2,
        losses: 1,
        goalsFor: 22,
        goalsAgainst: 8,
        cleanSheets: 5,
        matchesPlayed: 10,
        lastFiveResults: ['W', 'W', 'D', 'W', 'W'],
      },
      awayForm: {
        wins: 4,
        draws: 3,
        losses: 3,
        goalsFor: 15,
        goalsAgainst: 12,
        cleanSheets: 3,
        matchesPlayed: 10,
        lastFiveResults: ['L', 'W', 'D', 'W', 'L'],
      },
      headToHead: {
        matches: 10,
        homeWins: 5,
        awayWins: 3,
        draws: 2,
        avgHomeGoals: 1.8,
        avgAwayGoals: 1.2,
        lastMeetings: [
          { date: '2025-12-15', score: '2-1', winner: 'home' },
          { date: '2025-08-20', score: '1-1', winner: 'draw' },
          { date: '2025-03-10', score: '0-2', winner: 'away' },
        ],
      },
      homeInjuries: [
        {
          playerName: 'J. Smith',
          position: 'Midfielder',
          expectedReturn: '2026-01-15',
          severity: 'minor',
        },
      ],
      awayInjuries: [
        {
          playerName: 'R. Johnson',
          position: 'Defender',
          severity: 'moderate',
        },
        {
          playerName: 'M. Williams',
          position: 'Forward',
          expectedReturn: '2026-01-20',
          severity: 'severe',
        },
      ],
      odds: [
        {
          homeWin: 1.75,
          draw: 3.50,
          awayWin: 4.80,
          bookmaker: 'Bet365',
          market: '1X2',
          lastUpdated: new Date().toISOString(),
        },
        {
          homeWin: 1.73,
          draw: 3.60,
          awayWin: 4.90,
          bookmaker: 'William Hill',
          market: '1X2',
          lastUpdated: new Date().toISOString(),
        },
      ],
    };
  }

  private formatTeamName(canonicalId: string): string {
    return canonicalId
      .replace(/^(custom:|premier-league:|la-liga:|serie-a:|bundesliga:|ligue-1:|afcon:|champions-league:|world-cup:|euros:)/, '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private formatCompetitionName(canonicalId: string): string {
    const competitionMap: Record<string, string> = {
      'premier-league': 'English Premier League',
      'la-liga': 'La Liga',
      'serie-a': 'Serie A',
      'bundesliga': 'Bundesliga',
      'ligue-1': 'Ligue 1',
      'afcon': 'Africa Cup of Nations',
      'champions-league': 'UEFA Champions League',
      'world-cup': 'FIFA World Cup',
      'euros': 'UEFA European Championship',
    };
    return competitionMap[canonicalId] || canonicalId;
  }

  async searchFixtures(date: string, competitionId?: string): Promise<any[]> {
    if (!this.enableRealData || !this.apiKey) {
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/fixtures`, {
        headers: this.headers,
        params: {
          date,
          ...(competitionId && { league: competitionId }),
        },
      });
      return response.data.response || [];
    } catch (error) {
      console.error('Error searching fixtures:', error);
      return [];
    }
  }

  async getTeamStatistics(teamId: string, season: number): Promise<any> {
    if (!this.enableRealData || !this.apiKey) {
      return null;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/teams/statistics`, {
        headers: this.headers,
        params: {
          team: teamId,
          season,
        },
      });
      return response.data.response;
    } catch (error) {
      console.error('Error fetching team statistics:', error);
      return null;
    }
  }
}

export const sportsDataProvider = new SportsDataProvider();
