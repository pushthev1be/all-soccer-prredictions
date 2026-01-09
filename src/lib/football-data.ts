import axios from 'axios';

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const BASE_URL = process.env.FOOTBALL_DATA_BASE_URL || 'https://api.football-data.org/v4';

export const LEAGUE_CODES = {
  'premier-league': { code: 'PL', name: 'Premier League', country: 'England' },
  'la-liga': { code: 'PD', name: 'La Liga', country: 'Spain' },
  'serie-a': { code: 'SA', name: 'Serie A', country: 'Italy' },
  'bundesliga': { code: 'BL1', name: 'Bundesliga', country: 'Germany' },
  'ligue-1': { code: 'FL1', name: 'Ligue 1', country: 'France' },
  'champions-league': { code: 'CL', name: 'Champions League', country: 'Europe' },
  'europa-league': { code: 'EL', name: 'Europa League', country: 'Europe' },
  'world-cup': { code: 'WC', name: 'World Cup', country: 'World' },
  'euros': { code: 'EC', name: 'Euros', country: 'Europe' },
  'afcon': { code: 'AC', name: 'African Cup of Nations', country: 'Africa' },
} as const;

export type LeagueSlug = keyof typeof LEAGUE_CODES;

export interface FootballFixture {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamId?: number;
  awayTeamId?: number;
  competition: string;
  competitionCode: string;
  kickoff: string;
  status: string;
  matchday?: number;
  venue?: string;
  referee?: string;
  odds?: {
    homeWin?: number;
    draw?: number;
    awayWin?: number;
  };
}

export async function fetchUpcomingFixtures(
  leagueSlug: LeagueSlug,
  limit: number = 10
): Promise<FootballFixture[]> {
  const leagueConfig = LEAGUE_CODES[leagueSlug];

  if (!leagueConfig) {
    console.error(`Invalid league slug: ${leagueSlug}`);
    return getStaticFixtures(leagueSlug);
  }

  if (!API_KEY) {
    console.warn('FOOTBALL_DATA_API_KEY not set, using mock data');
    return getStaticFixtures(leagueSlug);
  }

  try {
    const response = await axios.get(
      `${BASE_URL}/competitions/${leagueConfig.code}/matches?status=SCHEDULED`,
      {
        headers: {
          'X-Auth-Token': API_KEY,
        },
        timeout: 5000,
      }
    );

    const matches = response.data.matches || [];

    return matches.slice(0, limit).map((match: any) => ({
      id: match.id,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      homeTeamId: match.homeTeam.id,
      awayTeamId: match.awayTeam.id,
      competition: match.competition.name,
      competitionCode: match.competition.code,
      kickoff: match.utcDate,
      status: match.status,
      matchday: match.matchday,
      venue: match.venue,
      referee: match.referees?.[0]?.name,
      odds: match.odds
        ? {
            homeWin: match.odds.homeWin,
            draw: match.odds.draw,
            awayWin: match.odds.awayWin,
          }
        : undefined,
    }));
  } catch (error) {
    console.error(`Error fetching ${leagueSlug} fixtures from Football Data API:`, error);
    // Graceful fallback to mock data
    return getStaticFixtures(leagueSlug);
  }
}

export async function fetchTeamStats(teamId: number): Promise<any> {
  if (!API_KEY) return null;

  try {
    const response = await axios.get(`${BASE_URL}/teams/${teamId}`, {
      headers: {
        'X-Auth-Token': API_KEY,
      },
      timeout: 5000,
    });

    return response.data;
  } catch (error) {
    console.error(`Error fetching team stats for team ${teamId}:`, error);
    return null;
  }
}

export async function fetchHeadToHead(
  teamId1: number,
  teamId2: number
): Promise<any> {
  if (!API_KEY) return null;

  try {
    const response = await axios.get(
      `${BASE_URL}/matches?competitions=CL&status=FINISHED`,
      {
        headers: {
          'X-Auth-Token': API_KEY,
        },
        timeout: 5000,
      }
    );

    const matches = response.data.matches || [];
    return matches.filter(
      (m: any) =>
        (m.homeTeam.id === teamId1 && m.awayTeam.id === teamId2) ||
        (m.homeTeam.id === teamId2 && m.awayTeam.id === teamId1)
    );
  } catch (error) {
    console.error('Error fetching head-to-head data:', error);
    return [];
  }
}

function getStaticFixtures(leagueSlug: LeagueSlug): FootballFixture[] {
  const leagueConfig = LEAGUE_CODES[leagueSlug];
  const now = new Date();

  const staticFixtures: Record<LeagueSlug, FootballFixture[]> = {
    'premier-league': [
      {
        id: 1,
        homeTeam: 'Manchester City',
        awayTeam: 'Manchester United',
        competition: 'Premier League',
        competitionCode: 'PL',
        kickoff: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'SCHEDULED',
        venue: 'Etihad Stadium',
        odds: { homeWin: 1.75, draw: 3.5, awayWin: 4.8 },
      },
      {
        id: 2,
        homeTeam: 'Liverpool',
        awayTeam: 'Arsenal',
        competition: 'Premier League',
        competitionCode: 'PL',
        kickoff: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'SCHEDULED',
        venue: 'Anfield',
        odds: { homeWin: 2.1, draw: 3.2, awayWin: 3.6 },
      },
      {
        id: 3,
        homeTeam: 'Chelsea',
        awayTeam: 'Tottenham',
        competition: 'Premier League',
        competitionCode: 'PL',
        kickoff: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'SCHEDULED',
        venue: 'Stamford Bridge',
        odds: { homeWin: 1.9, draw: 3.4, awayWin: 4.2 },
      },
    ],
    'la-liga': [
      {
        id: 101,
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona',
        competition: 'La Liga',
        competitionCode: 'PD',
        kickoff: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'SCHEDULED',
        venue: 'Santiago Bernabéu',
        odds: { homeWin: 1.85, draw: 3.4, awayWin: 4.5 },
      },
    ],
    'serie-a': [
      {
        id: 201,
        homeTeam: 'Inter Milan',
        awayTeam: 'AC Milan',
        competition: 'Serie A',
        competitionCode: 'SA',
        kickoff: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'SCHEDULED',
        venue: 'San Siro',
        odds: { homeWin: 1.9, draw: 3.3, awayWin: 4.1 },
      },
    ],
    'bundesliga': [],
    'ligue-1': [],
    'champions-league': [],
    'europa-league': [],
    'world-cup': [],
    'euros': [],
    'afcon': [],
  };

  return staticFixtures[leagueSlug] || [];
}
