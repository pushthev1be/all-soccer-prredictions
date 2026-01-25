import { NextResponse } from 'next/server';

interface LiveMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  minute: string | null;
  competition: string;
  startTime: string;
}

const LEAGUES = [
  'Premier League',
  'La Liga',
  'Serie A',
  'Bundesliga',
  'Ligue 1',
  'Champions League',
  'Europa League',
];

export async function GET() {
  const apiKey = process.env.SERPAPI_API_KEY;
  
  if (!apiKey) {
    // Return mock data when API key is not available
    return NextResponse.json({
      matches: getMockLiveMatches(),
      lastUpdated: new Date().toISOString(),
      source: 'mock',
    });
  }

  try {
    const allMatches: LiveMatch[] = [];
    
    // Fetch live scores for each league
    for (const league of LEAGUES) {
      const matches = await fetchLeagueLiveScores(apiKey, league);
      allMatches.push(...matches);
    }

    // Sort by status (live first, then upcoming)
    allMatches.sort((a, b) => {
      const aIsLive = a.status.toLowerCase().includes('live') || a.minute !== null;
      const bIsLive = b.status.toLowerCase().includes('live') || b.minute !== null;
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      return 0;
    });

    return NextResponse.json({
      matches: allMatches.slice(0, 10), // Limit to 10 matches
      lastUpdated: new Date().toISOString(),
      source: 'serpapi',
    });
  } catch (error) {
    console.error('Error fetching live scores:', error);
    return NextResponse.json({
      matches: getMockLiveMatches(),
      lastUpdated: new Date().toISOString(),
      source: 'mock',
      error: 'Failed to fetch live data',
    });
  }
}

async function fetchLeagueLiveScores(apiKey: string, league: string): Promise<LiveMatch[]> {
  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      engine: 'google',
      q: `${league} live scores today`,
      hl: 'en',
      gl: 'us',
      no_cache: 'false',
    });

    const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
    
    if (!response.ok) {
      console.error(`SerpAPI request failed for ${league}:`, response.status);
      return [];
    }

    const data = await response.json();
    const sportsResults = data.sports_results;

    if (!sportsResults || !sportsResults.games) {
      return [];
    }

    return sportsResults.games.map((game: any, index: number): LiveMatch => {
      const teams = game.teams || [];
      const homeTeam = teams[0] || {};
      const awayTeam = teams[1] || {};

      // Parse status and minute
      let status = game.status || 'Scheduled';
      let minute: string | null = null;

      if (status.includes("'")) {
        minute = status.replace("'", '');
        status = 'Live';
      } else if (status.toLowerCase() === 'ft' || status.toLowerCase() === 'final') {
        status = 'FT';
      } else if (status.toLowerCase() === 'ht') {
        status = 'HT';
        minute = '45';
      }

      return {
        id: `${league}-${index}-${Date.now()}`,
        homeTeam: homeTeam.name || 'TBD',
        awayTeam: awayTeam.name || 'TBD',
        homeScore: homeTeam.score ? parseInt(homeTeam.score, 10) : null,
        awayScore: awayTeam.score ? parseInt(awayTeam.score, 10) : null,
        status,
        minute,
        competition: game.tournament || league,
        startTime: game.date || new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error(`Error fetching ${league} scores:`, error);
    return [];
  }
}

function getMockLiveMatches(): LiveMatch[] {
  const now = new Date();
  return [
    {
      id: 'mock-1',
      homeTeam: 'Manchester United',
      awayTeam: 'Liverpool',
      homeScore: 2,
      awayScore: 1,
      status: 'Live',
      minute: '67',
      competition: 'Premier League',
      startTime: now.toISOString(),
    },
    {
      id: 'mock-2',
      homeTeam: 'Real Madrid',
      awayTeam: 'Barcelona',
      homeScore: 1,
      awayScore: 1,
      status: 'HT',
      minute: '45',
      competition: 'La Liga',
      startTime: now.toISOString(),
    },
    {
      id: 'mock-3',
      homeTeam: 'Juventus',
      awayTeam: 'Inter Milan',
      homeScore: null,
      awayScore: null,
      status: 'Scheduled',
      minute: null,
      competition: 'Serie A',
      startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-4',
      homeTeam: 'Bayern Munich',
      awayTeam: 'Borussia Dortmund',
      homeScore: 3,
      awayScore: 2,
      status: 'FT',
      minute: null,
      competition: 'Bundesliga',
      startTime: now.toISOString(),
    },
    {
      id: 'mock-5',
      homeTeam: 'PSG',
      awayTeam: 'Marseille',
      homeScore: 0,
      awayScore: 0,
      status: 'Live',
      minute: '23',
      competition: 'Ligue 1',
      startTime: now.toISOString(),
    },
  ];
}
