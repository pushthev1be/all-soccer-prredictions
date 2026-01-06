export interface SampleFixture {
  id: string;
  competition: string;
  canonicalCompetitionId: string;
  homeTeam: string;
  canonicalHomeTeamId: string;
  awayTeam: string;
  canonicalAwayTeamId: string;
  kickoffTimeUTC: string;
  venue?: string;
}

const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

export const SAMPLE_FIXTURES: SampleFixture[] = [
  {
    id: "prem-001",
    competition: "Premier League",
    canonicalCompetitionId: "custom:premier-league",
    homeTeam: "Chelsea",
    canonicalHomeTeamId: "custom:chelsea",
    awayTeam: "Manchester City",
    canonicalAwayTeamId: "custom:manchester-city",
    kickoffTimeUTC: hoursFromNow(4),
    venue: "Stamford Bridge",
  },
  {
    id: "prem-002",
    competition: "Premier League",
    canonicalCompetitionId: "custom:premier-league",
    homeTeam: "Liverpool",
    canonicalHomeTeamId: "custom:liverpool",
    awayTeam: "Arsenal",
    canonicalAwayTeamId: "custom:arsenal",
    kickoffTimeUTC: hoursFromNow(24),
    venue: "Anfield",
  },
  {
    id: "ucl-001",
    competition: "Champions League",
    canonicalCompetitionId: "custom:champions-league",
    homeTeam: "Real Madrid",
    canonicalHomeTeamId: "custom:real-madrid",
    awayTeam: "Bayern Munich",
    canonicalAwayTeamId: "custom:bayern-munich",
    kickoffTimeUTC: hoursFromNow(72),
    venue: "Santiago Bernabeu",
  },
  {
    id: "laliga-001",
    competition: "La Liga",
    canonicalCompetitionId: "custom:la-liga",
    homeTeam: "Barcelona",
    canonicalHomeTeamId: "custom:barcelona",
    awayTeam: "Atletico Madrid",
    canonicalAwayTeamId: "custom:atletico-madrid",
    kickoffTimeUTC: hoursFromNow(96),
    venue: "Olympic Stadium",
  },
];
