// Team badge URL mapping - uses public APIs and CDNs
// This maps common team names to their badge/logo URLs

const TEAM_BADGE_MAP: Record<string, string> = {
  // Premier League
  'manchester united': 'https://platform.api-sports.io/assets/teams/33.png',
  'manchester city': 'https://platform.api-sports.io/assets/teams/50.png',
  'liverpool': 'https://platform.api-sports.io/assets/teams/40.png',
  'chelsea': 'https://platform.api-sports.io/assets/teams/49.png',
  'arsenal': 'https://platform.api-sports.io/assets/teams/42.png',
  'tottenham': 'https://platform.api-sports.io/assets/teams/47.png',
  'newcastle united': 'https://platform.api-sports.io/assets/teams/34.png',
  'brighton': 'https://platform.api-sports.io/assets/teams/51.png',
  'aston villa': 'https://platform.api-sports.io/assets/teams/66.png',
  'west ham': 'https://platform.api-sports.io/assets/teams/48.png',
  
  // Serie A
  'as roma': 'https://platform.api-sports.io/assets/teams/87.png',
  'juventus': 'https://platform.api-sports.io/assets/teams/39.png',
  'ac milan': 'https://platform.api-sports.io/assets/teams/73.png',
  'inter milan': 'https://platform.api-sports.io/assets/teams/44.png',
  'napoli': 'https://platform.api-sports.io/assets/teams/99.png',
  'lazio': 'https://platform.api-sports.io/assets/teams/88.png',
  'us sassuolo calcio': 'https://platform.api-sports.io/assets/teams/100.png',
  'atalanta': 'https://platform.api-sports.io/assets/teams/90.png',
  
  // La Liga
  'real madrid': 'https://platform.api-sports.io/assets/teams/541.png',
  'barcelona': 'https://platform.api-sports.io/assets/teams/529.png',
  'atletico madrid': 'https://platform.api-sports.io/assets/teams/530.png',
  'seville': 'https://platform.api-sports.io/assets/teams/532.png',
  'real sociedad': 'https://platform.api-sports.io/assets/teams/548.png',
  
  // Bundesliga
  'bayern munich': 'https://platform.api-sports.io/assets/teams/25.png',
  'borussia dortmund': 'https://platform.api-sports.io/assets/teams/26.png',
  'rb leipzig': 'https://platform.api-sports.io/assets/teams/560.png',
  'leverkusen': 'https://platform.api-sports.io/assets/teams/31.png',
  
  // Ligue 1
  'paris saint-germain': 'https://platform.api-sports.io/assets/teams/80.png',
  'psg': 'https://platform.api-sports.io/assets/teams/80.png',
  'marseille': 'https://platform.api-sports.io/assets/teams/81.png',
  'lyon': 'https://platform.api-sports.io/assets/teams/79.png',
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
