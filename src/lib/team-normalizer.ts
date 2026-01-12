export function normalizeTeamName(teamName: string): string {
  if (!teamName) return '';

  const lower = teamName.toLowerCase().trim();

  const variations: Record<string, string> = {
    // Manchester
    'manchester united fc': 'Manchester United',
    'man united fc': 'Manchester United',
    'manchester united': 'Manchester United',
    'man united': 'Manchester United',
    'man u': 'Manchester United',
    'manchester city fc': 'Manchester City',
    'man city fc': 'Manchester City',
    'manchester city': 'Manchester City',
    'man city': 'Manchester City',
    // London
    'arsenal fc': 'Arsenal',
    'arsenal': 'Arsenal',
    'tottenham hotspur fc': 'Tottenham',
    'tottenham hotspur': 'Tottenham',
    'tottenham': 'Tottenham',
    'spurs': 'Tottenham',
    'chelsea fc': 'Chelsea',
    'chelsea': 'Chelsea',
    'west ham united fc': 'West Ham',
    'west ham united': 'West Ham',
    'west ham': 'West Ham',
    // Other Premier League
    'liverpool fc': 'Liverpool',
    'liverpool': 'Liverpool',
    'everton fc': 'Everton',
    'everton': 'Everton',
    'newcastle united fc': 'Newcastle',
    'newcastle united': 'Newcastle',
    'newcastle': 'Newcastle',
    'aston villa fc': 'Aston Villa',
    'aston villa': 'Aston Villa',
    'crystal palace fc': 'Crystal Palace',
    'crystal palace': 'Crystal Palace',
    'wolves': 'Wolves',
    'wolverhampton': 'Wolves',
    'wolverhampton wanderers': 'Wolves',
    // La Liga
    'real madrid cf': 'Real Madrid',
    'real madrid': 'Real Madrid',
    'fc barcelona': 'Barcelona',
    'barcelona': 'Barcelona',
    'atletico madrid': 'Atletico Madrid',
    'atlético madrid': 'Atletico Madrid',
    'sevilla fc': 'Sevilla',
    'sevilla': 'Sevilla',
    'real sociedad': 'Real Sociedad',
    'real betis': 'Real Betis',
    'villarreal cf': 'Villarreal',
    'villarreal': 'Villarreal',
    'athletic bilbao': 'Athletic Bilbao',
    'valencia cf': 'Valencia',
    'valencia': 'Valencia',
  };

  if (variations[lower]) {
    return variations[lower];
  }

  // Standardize suffixes
  let normalized = teamName
    .replace(/\s+fc$/i, '')
    .replace(/\s+cf$/i, '')
    .replace(/\s+afc$/i, '')
    .replace(/\s+united$/i, ' United')
    .replace(/\s+city$/i, ' City')
    .trim();

  normalized = normalized
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return normalized || teamName;
}

export function getTeamId(teamName: string): number {
  const normalized = normalizeTeamName(teamName);

  const TEAM_IDS: Record<string, number> = {
    // Premier League
    'Manchester United': 33,
    'Manchester City': 50,
    'Liverpool': 64,
    'Chelsea': 61,
    'Arsenal': 57,
    'Tottenham': 73,
    'Tottenham Hotspur': 73,
    'West Ham': 563,
    'Aston Villa': 58,
    'Newcastle': 67,
    'Brighton': 397,
    'Brentford': 402,
    'Crystal Palace': 354,
    'Everton': 62,
    'Fulham': 63,
    'Nottingham Forest': 351,
    'Wolves': 76,
    'Bournemouth': 1044,
    'Burnley': 328,
    'Luton': 389,
    'Sheffield Utd': 356,
    // La Liga
    'Real Madrid': 86,
    'Barcelona': 81,
    'Atletico Madrid': 78,
    'Sevilla': 559,
    'Real Sociedad': 92,
    'Real Betis': 90,
    'Villarreal': 94,
    'Athletic Bilbao': 77,
    'Valencia': 95,
  };

  return TEAM_IDS[normalized] || 0;
}
