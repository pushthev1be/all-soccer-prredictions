// Team badge URL mapping - uses public APIs and CDNs
// This maps common team names to their badge/logo URLs

const TEAM_BADGE_MAP: Record<string, string> = {
  // Premier League
  'manchester united': 'https://media.api-sports.io/football/teams/33.png',
  'manchester city': 'https://media.api-sports.io/football/teams/50.png',
  'liverpool': 'https://media.api-sports.io/football/teams/40.png',
  'chelsea': 'https://media.api-sports.io/football/teams/49.png',
  'arsenal': 'https://media.api-sports.io/football/teams/42.png',
  'tottenham': 'https://media.api-sports.io/football/teams/47.png',
  'newcastle united': 'https://media.api-sports.io/football/teams/34.png',
  'brighton': 'https://media.api-sports.io/football/teams/51.png',
  'aston villa': 'https://media.api-sports.io/football/teams/66.png',
  'west ham': 'https://media.api-sports.io/football/teams/48.png',
  
  // Serie A
  'as roma': 'https://media.api-sports.io/football/teams/87.png',
  'juventus': 'https://media.api-sports.io/football/teams/39.png',
  'ac milan': 'https://media.api-sports.io/football/teams/73.png',
  'inter milan': 'https://media.api-sports.io/football/teams/44.png',
  'napoli': 'https://media.api-sports.io/football/teams/99.png',
  'lazio': 'https://media.api-sports.io/football/teams/88.png',
  'us sassuolo calcio': 'https://media.api-sports.io/football/teams/100.png',
  'atalanta': 'https://media.api-sports.io/football/teams/90.png',
  
  // La Liga
  'real madrid': 'https://media.api-sports.io/football/teams/541.png',
  'barcelona': 'https://media.api-sports.io/football/teams/529.png',
  'atletico madrid': 'https://media.api-sports.io/football/teams/530.png',
  'seville': 'https://media.api-sports.io/football/teams/532.png',
  'real sociedad': 'https://media.api-sports.io/football/teams/548.png',
  
  // Bundesliga
  'bayern munich': 'https://media.api-sports.io/football/teams/25.png',
  'borussia dortmund': 'https://media.api-sports.io/football/teams/26.png',
  'rb leipzig': 'https://media.api-sports.io/football/teams/560.png',
  'leverkusen': 'https://media.api-sports.io/football/teams/31.png',
  
  // Ligue 1
  'paris saint-germain': 'https://media.api-sports.io/football/teams/80.png',
  'psg': 'https://media.api-sports.io/football/teams/80.png',
  'marseille': 'https://media.api-sports.io/football/teams/81.png',
  'lyon': 'https://media.api-sports.io/football/teams/79.png',
};

export function getTeamBadgeUrl(teamName: string): string {
  const normalizedName = teamName.toLowerCase().trim();
  
  // Direct lookup
  if (TEAM_BADGE_MAP[normalizedName]) {
    return TEAM_BADGE_MAP[normalizedName];
  }
  
  // Partial match fallback
  for (const [key, url] of Object.entries(TEAM_BADGE_MAP)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return url;
    }
  }
  
  // Return a default placeholder if team not found
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle"%3E⚽%3C/text%3E%3C/svg%3E';
}
