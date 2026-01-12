const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const BASE_URL = 'https://api.football-data.org/v4';

export interface RealTeamStats {
  team: {
    id: number;
    name: string;
    shortName: string;
    crest: string;
  };
  position: number;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form?: string;
}

export interface RealMatchData {
  id: number;
  homeTeam: {
    id: number;
    name: string;
    shortName: string;
    crest: string;
  };
  awayTeam: {
    id: number;
    name: string;
    shortName: string;
    crest: string;
  };
  score: {
    winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
    fullTime: {
      home: number | null;
      away: number | null;
    };
  };
  status: string;
  utcDate: string;
  competition: {
    id: number;
    name: string;
    code: string;
  };
  odds?: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
}

export class RealFootballData {
  private headers = {
    'X-Auth-Token': API_KEY!,
    'Content-Type': 'application/json',
  };

  // Get real Premier League standings
  async getPremierLeagueStandings(): Promise<RealTeamStats[]> {
    try {
      const response = await fetch(`${BASE_URL}/competitions/PL/standings`, {
        headers: this.headers,
        next: { revalidate: 3600 } // Cache 1 hour
      });

      if (!response.ok) {
        throw new Error(`Football Data API error: ${response.status}`);
      }

      const data = await response.json();
      return data.standings[0].table.map((team: any) => ({
        team: {
          id: team.team.id,
          name: team.team.name,
          shortName: team.team.shortName,
          crest: team.team.crest,
        },
        position: team.position,
        playedGames: team.playedGames,
        won: team.won,
        draw: team.draw,
        lost: team.lost,
        points: team.points,
        goalsFor: team.goalsFor,
        goalsAgainst: team.goalsAgainst,
        goalDifference: team.goalDifference,
        form: team.form?.split(',')?.join('') || '-----',
      }));
    } catch (error) {
      console.error('Failed to fetch Premier League standings:', error);
      return [];
    }
  }

  // Get real team by ID
  async getTeamById(teamId: number) {
    try {
      const response = await fetch(`${BASE_URL}/teams/${teamId}`, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Team API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch team ${teamId}:`, error);
      return null;
    }
  }

  // Get real matches for a team
  async getTeamMatches(teamId: number, limit: number = 10): Promise<RealMatchData[]> {
    try {
      const response = await fetch(
        `${BASE_URL}/teams/${teamId}/matches?status=FINISHED&limit=${limit}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`Team matches API error: ${response.status}`);
      }

      const data = await response.json();
      return data.matches.map((match: any) => ({
        id: match.id,
        homeTeam: {
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          shortName: match.homeTeam.shortName,
          crest: match.homeTeam.crest,
        },
        awayTeam: {
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          shortName: match.awayTeam.shortName,
          crest: match.awayTeam.crest,
        },
        score: {
          winner: match.score.winner,
          fullTime: match.score.fullTime,
        },
        status: match.status,
        utcDate: match.utcDate,
        competition: {
          id: match.competition.id,
          name: match.competition.name,
          code: match.competition.code,
        },
      }));
    } catch (error) {
      console.error(`Failed to fetch team ${teamId} matches:`, error);
      return [];
    }
  }

  // Get head-to-head matches between two teams
  async getHeadToHead(team1Id: number, team2Id: number): Promise<RealMatchData[]> {
    try {
      const response = await fetch(
        `${BASE_URL}/teams/${team1Id}/matches?status=FINISHED&limit=50`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`H2H API error: ${response.status}`);
      }

      const data = await response.json();
      // Filter matches against the specific opponent
      const h2hMatches = data.matches.filter((match: any) => 
        match.homeTeam.id === team2Id || match.awayTeam.id === team2Id
      );
      
      return h2hMatches.slice(0, 10); // Last 10 meetings
    } catch (error) {
      console.error(`Failed to fetch H2H ${team1Id} vs ${team2Id}:`, error);
      return [];
    }
  }

  // Get upcoming fixtures for a competition
  async getUpcomingFixtures(competitionCode: string = 'PL', limit: number = 20) {
    try {
      const response = await fetch(
        `${BASE_URL}/competitions/${competitionCode}/matches?status=SCHEDULED&limit=${limit}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`Fixtures API error: ${response.status}`);
      }

      const data = await response.json();
      return data.matches;
    } catch (error) {
      console.error(`Failed to fetch ${competitionCode} fixtures:`, error);
      return [];
    }
  }

  // Get real odds for a match
  async getMatchOdds(matchId: number) {
    try {
      const response = await fetch(`${BASE_URL}/matches/${matchId}/odds`, {
        headers: this.headers,
      });

      if (!response.ok) {
        return null; // Odds not always available
      }

      const data = await response.json();
      return data.odds?.[0]?.bookmakers?.[0]?.markets?.[0]?.odds || null;
    } catch (error) {
      console.error(`Failed to fetch odds for match ${matchId}:`, error);
      return null;
    }
  }

  // Get standings for any competition
  async getCompetitionStandings(competitionCode: string): Promise<RealTeamStats[]> {
    try {
      const response = await fetch(`${BASE_URL}/competitions/${competitionCode}/standings`, {
        headers: this.headers,
        next: { revalidate: 3600 }
      });

      if (!response.ok) {
        throw new Error(`Competition standings API error: ${response.status}`);
      }

      const data = await response.json();
      return data.standings[0].table.map((team: any) => ({
        team: {
          id: team.team.id,
          name: team.team.name,
          shortName: team.team.shortName,
          crest: team.team.crest,
        },
        position: team.position,
        playedGames: team.playedGames,
        won: team.won,
        draw: team.draw,
        lost: team.lost,
        points: team.points,
        goalsFor: team.goalsFor,
        goalsAgainst: team.goalsAgainst,
        goalDifference: team.goalDifference,
        form: team.form?.split(',')?.join('') || '-----',
      }));
    } catch (error) {
      console.error(`Failed to fetch ${competitionCode} standings:`, error);
      return [];
    }
  }
}

// Singleton instance
export const realFootballData = new RealFootballData();
