import axios from 'axios';

export interface OddsResult {
  homeWin?: number;
  draw?: number;
  awayWin?: number;
  bookmaker?: string;
  market: '1X2';
  lastUpdated?: string;
  source: 'the-odds-api';
}

interface OddsApiOutcome {
  name: string;
  price: number;
}

interface OddsApiMarket {
  key: string; // e.g. "h2h"
  outcomes: OddsApiOutcome[];
}

interface OddsApiBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsApiMarket[];
}

interface OddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
}

const API_KEY = process.env.THE_ODDS_API_KEY || process.env.ODDS_API_KEY;
const BASE_URL = process.env.THE_ODDS_API_BASE_URL || 'https://api.the-odds-api.com/v4';

const DEFAULT_REGIONS = ['uk', 'eu', 'us', 'au'];
const DEFAULT_MARKETS = ['h2h'];
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const SPORT_KEY_BY_COMPETITION: Record<string, string> = {
  'premier-league': 'soccer_epl',
  'la-liga': 'soccer_spain_la_liga',
  'serie-a': 'soccer_italy_serie_a',
  'bundesliga': 'soccer_germany_bundesliga',
  'ligue-1': 'soccer_france_ligue_one',
  'champions-league': 'soccer_uefa_champs_league',
  'european-championship': 'soccer_uefa_european_championship',
  'world-cup': 'soccer_fifa_world_cup',
  'afcon': 'soccer_africa_cup_of_nations',
};

const BOOKMAKER_PRIORITY = [
  'pinnacle',
  'betfair',
  'betfair_ex',
  'bet365',
  'williamhill',
  'fanduel',
  'draftkings',
  'unibet_eu',
  'caesars',
  'pointsbetus',
];

type CacheEntry = {
  data: OddsResult;
  expiresAt: number;
};

const oddsCache = new Map<string, CacheEntry>();

function normalizeTeamName(value: string): string {
  return value
    .toLowerCase()
    .replace(/football club|fc|cf|club|athletic|atletico|deportivo|sporting|real|ac|sc|cd/gi, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function teamsMatch(requested: string, actual: string): boolean {
  const normalizedRequested = normalizeTeamName(requested);
  const normalizedActual = normalizeTeamName(actual);
  return (
    normalizedRequested === normalizedActual ||
    normalizedRequested.includes(normalizedActual) ||
    normalizedActual.includes(normalizedRequested)
  );
}

function selectSportKey(competitionId?: string): string {
  if (competitionId) {
    const key = SPORT_KEY_BY_COMPETITION[competitionId.replace('custom:', '')];
    if (key) return key;
  }
  return 'soccer_epl';
}

function pickBestBookmaker(bookmakers: OddsApiBookmaker[]): OddsApiBookmaker | null {
  if (!bookmakers || bookmakers.length === 0) return null;

  const scored = bookmakers.map((bm) => {
    const priority = BOOKMAKER_PRIORITY.indexOf(bm.key);
    const h2h = bm.markets.find((m) => m.key === 'h2h');
    const outcomes = h2h?.outcomes || [];
    const averagePrice =
      outcomes.length > 0
        ? outcomes.reduce((sum, outcome) => sum + (outcome.price || 0), 0) / outcomes.length
        : 0;

    return {
      bm,
      score: (priority >= 0 ? 100 - priority * 5 : 50) + averagePrice,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.bm || null;
}

function buildOddsResult(
  event: OddsApiEvent,
  bookmaker: OddsApiBookmaker,
  requestedHome: string,
  requestedAway: string
): OddsResult | null {
  const h2h = bookmaker.markets.find((m) => m.key === 'h2h');
  if (!h2h || !h2h.outcomes) return null;

  const homeAligned = teamsMatch(requestedHome, event.home_team) && teamsMatch(requestedAway, event.away_team);
  const awayAligned = teamsMatch(requestedHome, event.away_team) && teamsMatch(requestedAway, event.home_team);

  const odds: OddsResult = {
    market: '1X2',
    source: 'the-odds-api',
    bookmaker: bookmaker.title || bookmaker.key,
    lastUpdated: bookmaker.last_update,
  };

  h2h.outcomes.forEach((outcome) => {
    const normalizedOutcome = normalizeTeamName(outcome.name);
    const homeName = normalizeTeamName(event.home_team);
    const awayName = normalizeTeamName(event.away_team);

    if (normalizedOutcome === 'draw') {
      odds.draw = outcome.price;
      return;
    }

    if (normalizedOutcome === homeName) {
      if (homeAligned) odds.homeWin = outcome.price;
      if (awayAligned) odds.awayWin = outcome.price;
      return;
    }

    if (normalizedOutcome === awayName) {
      if (homeAligned) odds.awayWin = outcome.price;
      if (awayAligned) odds.homeWin = outcome.price;
    }
  });

  if (!odds.homeWin && !odds.awayWin && !odds.draw) return null;
  return odds;
}

export async function fetchLiveOdds(params: {
  homeTeam: string;
  awayTeam: string;
  competitionId?: string;
  kickoffTime?: Date | string;
  regions?: string[];
}): Promise<OddsResult | null> {
  const { homeTeam, awayTeam, competitionId, regions } = params;

  if (!API_KEY) {
    console.warn('⚠️ THE_ODDS_API_KEY not set - skipping live odds fetch');
    return null;
  }

  if (!homeTeam || !awayTeam) {
    return null;
  }

  const sportKey = selectSportKey(competitionId);
  const cacheKey = `${sportKey}:${normalizeTeamName(homeTeam)}:${normalizeTeamName(awayTeam)}`;
  const cached = oddsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const response = await axios.get<OddsApiEvent[]>(`${BASE_URL}/sports/${sportKey}/odds`, {
      params: {
        apiKey: API_KEY,
        regions: (regions && regions.length > 0 ? regions : DEFAULT_REGIONS).join(','),
        markets: DEFAULT_MARKETS.join(','),
        oddsFormat: 'decimal',
        dateFormat: 'iso',
      },
      timeout: 8000,
    });

    const remaining = response.headers['x-requests-remaining'];
    if (remaining !== undefined) {
      console.log(`ℹ️ The Odds API remaining requests: ${remaining}`);
    }

    const events = response.data || [];
    const matchingEvent = events.find((event) => {
      const homeVsAway = teamsMatch(homeTeam, event.home_team) && teamsMatch(awayTeam, event.away_team);
      const awayVsHome = teamsMatch(homeTeam, event.away_team) && teamsMatch(awayTeam, event.home_team);
      return homeVsAway || awayVsHome;
    });

    if (!matchingEvent) {
      console.warn(`No matching odds event found for ${homeTeam} vs ${awayTeam} (${sportKey})`);
      return null;
    }

    const bookmaker = pickBestBookmaker(matchingEvent.bookmakers);
    if (!bookmaker) {
      console.warn(`No bookmakers returned for ${matchingEvent.id}`);
      return null;
    }

    const odds = buildOddsResult(matchingEvent, bookmaker, homeTeam, awayTeam);
    if (!odds) return null;

    oddsCache.set(cacheKey, {
      data: odds,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return odds;
  } catch (error) {
    console.error('Failed to fetch live odds from The Odds API:', error);
    return null;
  }
}
