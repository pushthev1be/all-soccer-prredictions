export interface Fixture {
  home: string;
  away: string;
  kickoff: string; // ISO timestamp in UTC
}

export interface Competition {
  id: string; // slug used in dropdown values
  name: string;
  category: "domestic" | "international" | "continental";
  region: string;
  icon?: string;
  teams: string[];
  fixtures: Fixture[];
}

const now = new Date();
const plusDays = (days: number) => {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(17, 0, 0, 0);
  return d.toISOString();
};

export const competitions: Competition[] = [
  {
    id: "premier-league",
    name: "Premier League",
    category: "domestic",
    region: "England",
    icon: "🏴",
    teams: [
      "Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton",
      "Chelsea", "Crystal Palace", "Everton", "Fulham", "Ipswich Town",
      "Leicester City", "Liverpool", "Manchester City", "Manchester United", "Newcastle",
      "Nottingham Forest", "Southampton", "Tottenham", "West Ham", "Wolverhampton"
    ],
    fixtures: [
      { home: "Arsenal", away: "Chelsea", kickoff: plusDays(2) },
      { home: "Liverpool", away: "Manchester City", kickoff: plusDays(3) },
      { home: "Tottenham", away: "Newcastle", kickoff: plusDays(4) },
    ],
  },
  {
    id: "la-liga",
    name: "La Liga",
    category: "domestic",
    region: "Spain",
    icon: "🇪🇸",
    teams: [
      "Alaves", "Almeria", "Athletic Club", "Atletico Madrid", "Barcelona",
      "Betis", "Celta Vigo", "Cadiz", "Getafe", "Girona", "Las Palmas",
      "Leganes", "Mallorca", "Osasuna", "Rayo Vallecano", "Real Madrid",
      "Real Sociedad", "Sevilla", "Valencia", "Villarreal"
    ],
    fixtures: [
      { home: "Real Madrid", away: "Sevilla", kickoff: plusDays(2) },
      { home: "Barcelona", away: "Atletico Madrid", kickoff: plusDays(3) },
      { home: "Valencia", away: "Villarreal", kickoff: plusDays(5) },
    ],
  },
  {
    id: "serie-a",
    name: "Serie A",
    category: "domestic",
    region: "Italy",
    icon: "🇮🇹",
    teams: [
      "AC Milan", "Atalanta", "Bologna", "Cagliari", "Como", "Empoli",
      "Fiorentina", "Frosinone", "Genoa", "Hellas Verona", "Inter",
      "Juventus", "Lazio", "Lecce", "Monza", "Napoli", "Parma", "Roma",
      "Torino", "Udinese"
    ],
    fixtures: [
      { home: "Inter", away: "Juventus", kickoff: plusDays(1) },
      { home: "AC Milan", away: "Napoli", kickoff: plusDays(4) },
      { home: "Roma", away: "Lazio", kickoff: plusDays(6) },
    ],
  },
  {
    id: "bundesliga",
    name: "Bundesliga",
    category: "domestic",
    region: "Germany",
    icon: "🇩🇪",
    teams: [
      "Augsburg", "Bayer Leverkusen", "Bayern Munich", "Bochum", "Borussia Dortmund",
      "Borussia Monchengladbach", "Darmstadt", "Eintracht Frankfurt", "Freiburg",
      "Heidenheim", "Hertha Berlin", "Hoffenheim", "Koln", "Mainz", "RB Leipzig",
      "St Pauli", "Stuttgart", "Union Berlin"
    ],
    fixtures: [
      { home: "Bayern Munich", away: "Borussia Dortmund", kickoff: plusDays(2) },
      { home: "RB Leipzig", away: "Bayer Leverkusen", kickoff: plusDays(3) },
    ],
  },
  {
    id: "ligue-1",
    name: "Ligue 1",
    category: "domestic",
    region: "France",
    icon: "🇫🇷",
    teams: [
      "Angers", "Brest", "Clermont", "Dijon", "Lens", "Le Havre", "Lille",
      "Lorient", "Lyon", "Marseille", "Metz", "Monaco", "Montpellier",
      "Nantes", "Nice", "Paris Saint-Germain", "Reims", "Rennes"
    ],
    fixtures: [
      { home: "Paris Saint-Germain", away: "Lille", kickoff: plusDays(2) },
      { home: "Marseille", away: "Lyon", kickoff: plusDays(4) },
    ],
  },
  {
    id: "afcon",
    name: "AFCON",
    category: "international",
    region: "Africa",
    icon: "🌍",
    teams: [
      "Algeria", "Angola", "Burkina Faso", "Cameroon", "Cape Verde", "DR Congo",
      "Egypt", "Equatorial Guinea", "Ghana", "Guinea", "Ivory Coast", "Mali",
      "Mauritania", "Morocco", "Mozambique", "Namibia", "Nigeria", "Senegal",
      "Sierra Leone", "South Africa", "Tanzania", "Tunisia", "Zambia", "Zimbabwe"
    ],
    fixtures: [
      { home: "Nigeria", away: "Senegal", kickoff: plusDays(7) },
      { home: "Morocco", away: "Egypt", kickoff: plusDays(8) },
      { home: "Cameroon", away: "Ivory Coast", kickoff: plusDays(9) },
    ],
  },
  {
    id: "champions-league",
    name: "UEFA Champions League",
    category: "continental",
    region: "Europe",
    icon: "⭐",
    teams: [
      "Arsenal", "Aston Villa", "Barcelona", "Bayer Leverkusen", "Bayern Munich",
      "Benfica", "Borussia Dortmund", "Celtic", "Chelsea", "Club Brugge",
      "Feyenoord", "Galatasaray", "Inter", "Juventus", "Liverpool", "Lyon",
      "Manchester City", "Manchester United", "Marseille", "Milan", "Napoli",
      "PSV", "Paris Saint-Germain", "Porto", "RB Leipzig", "Real Madrid",
      "Real Sociedad", "Roma", "Sporting CP", "Tottenham", "Union Berlin", "Villarreal"
    ],
    fixtures: [
      { home: "Real Madrid", away: "Manchester City", kickoff: plusDays(10) },
      { home: "Bayern Munich", away: "Arsenal", kickoff: plusDays(11) },
      { home: "Paris Saint-Germain", away: "Barcelona", kickoff: plusDays(12) },
    ],
  },
  {
    id: "world-cup",
    name: "FIFA World Cup",
    category: "international",
    region: "Global",
    icon: "🌎",
    teams: [
      "Argentina", "Australia", "Belgium", "Brazil", "Cameroon", "Canada", "Colombia",
      "Croatia", "Denmark", "Ecuador", "Egypt", "England", "France", "Germany",
      "Ghana", "Iran", "Italy", "Japan", "Mexico", "Morocco", "Netherlands",
      "Nigeria", "Norway", "Poland", "Portugal", "Qatar", "Saudi Arabia",
      "Senegal", "South Korea", "Spain", "Switzerland", "United States"
    ],
    fixtures: [
      { home: "England", away: "Brazil", kickoff: plusDays(14) },
      { home: "France", away: "Argentina", kickoff: plusDays(15) },
      { home: "Spain", away: "Germany", kickoff: plusDays(16) },
    ],
  },
  {
    id: "european-championship",
    name: "UEFA European Championship",
    category: "international",
    region: "Europe",
    icon: "🏆",
    teams: [
      "Albania", "Austria", "Belgium", "Croatia", "Czech Republic", "Denmark",
      "England", "France", "Germany", "Hungary", "Italy", "Netherlands", "Poland",
      "Portugal", "Romania", "Scotland", "Serbia", "Slovakia", "Slovenia",
      "Spain", "Sweden", "Switzerland", "Turkey", "Ukraine"
    ],
    fixtures: [
      { home: "Italy", away: "Spain", kickoff: plusDays(20) },
      { home: "England", away: "Germany", kickoff: plusDays(21) },
      { home: "Portugal", away: "France", kickoff: plusDays(22) },
    ],
  },
];

export const competitionMap: Record<string, Competition> = Object.fromEntries(
  competitions.map((competition) => [competition.id, competition])
);

const titleCase = (value: string) => value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");

export const competitionNameFromCanonical = (canonical?: string | null) => {
  if (!canonical) return null;
  const slug = canonical.replace(/^custom:/, "");
  return competitionMap[slug]?.name || titleCase(slug);
};

export const teamNameFromCanonical = (canonical?: string | null) => {
  if (!canonical) return null;
  const slug = canonical.replace(/^custom:/, "");
  return titleCase(slug);
};
