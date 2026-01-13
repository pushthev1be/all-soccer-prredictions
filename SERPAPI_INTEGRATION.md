# SerpAPI Sports Results Integration

## Overview
SerpAPI integration provides real-time sports data from Google Sports Results, including:
- Live match scores and updates
- Team standings and rankings
- Upcoming fixtures
- Recent match results
- Player statistics
- Video highlights

## Setup

### 1. Get SerpAPI Key
1. Visit https://serpapi.com/
2. Sign up for a free account (100 searches/month free tier)
3. Get your API key from the dashboard

### 2. Configure Environment
Add to `.env`:
```bash
SERPAPI_API_KEY="your_api_key_here"
```

## API Endpoints

### Get Team Data
```http
GET /api/serpapi/team?name=Manchester%20United%20F.C.
```

Response:
```json
{
  "success": true,
  "team": {
    "title": "Manchester United F.C.",
    "rankings": "8th in Premier League",
    "thumbnail": "https://...",
    "upcomingFixtures": [...],
    "recentResults": [...],
    "gameSpotlight": {...}
  }
}
```

### Get League Standings
```http
GET /api/serpapi/standings?league=Premier%20League
```

Response:
```json
{
  "success": true,
  "standings": {
    "title": "Premier League standings",
    "season": "2024–25",
    "round": "Regular season",
    "league": {
      "standings": [
        {
          "team": { "name": "Arsenal", "thumbnail": "..." },
          "pos": "1",
          "mp": "20",
          "w": "15",
          "pts": "48"
        }
      ]
    }
  }
}
```

### Get Fixtures
```http
GET /api/serpapi/fixtures?team=Liverpool%20FC
GET /api/serpapi/fixtures?competition=Premier%20League
```

Response:
```json
{
  "success": true,
  "count": 5,
  "fixtures": [
    {
      "tournament": "Premier League",
      "stadium": "Anfield",
      "status": "TBD",
      "date": "Jan 18",
      "time": "3:00 PM",
      "teams": [
        { "name": "Liverpool", "thumbnail": "..." },
        { "name": "Manchester United", "thumbnail": "..." }
      ]
    }
  ]
}
```

### Get Match Data
```http
GET /api/serpapi/match?query=Liverpool%20vs%20Manchester%20United
GET /api/serpapi/match?query=Liverpool%20vs%20Manchester%20United&live=true
```

Response:
```json
{
  "success": true,
  "match": {
    "title": "Liverpool vs Manchester United",
    "game_spotlight": {
      "league": "Premier League",
      "stadium": "Anfield",
      "date": "Jan 18, 24",
      "status": "Live",
      "teams": [
        { "name": "Liverpool", "score": "2" },
        { "name": "Manchester United", "score": "1" }
      ]
    }
  },
  "highlights": {
    "link": "https://youtube.com/...",
    "thumbnail": "...",
    "duration": "9:45"
  }
}
```

## Usage in Code

```typescript
import { serpApiSports } from '@/lib/serpapi-sports';

// Check if configured
if (!serpApiSports.isConfigured()) {
  console.log('SerpAPI not configured');
}

// Get team data
const teamData = await serpApiSports.getTeamResults('Manchester United F.C.');

// Get upcoming fixtures
const fixtures = await serpApiSports.getUpcomingFixtures('Liverpool FC');

// Get recent results
const results = await serpApiSports.getRecentResults('Arsenal FC');

// Get league standings
const standings = await serpApiSports.getLeagueStandings('Premier League');

// Get live match
const liveMatch = await serpApiSports.getLiveMatch('Liverpool vs Manchester United');

// Get match highlights
const highlights = await serpApiSports.getMatchHighlights('Liverpool vs Manchester United');

// Get player stats
const playerStats = await serpApiSports.getPlayerStats('Erling Haaland');
```

## Integration Ideas

### 1. Enhanced Fixture Selection
Update prediction creation form to fetch real fixtures from SerpAPI:
```typescript
// In prediction create form
const fixtures = await fetch('/api/serpapi/fixtures?competition=Premier League')
  .then(r => r.json());
```

### 2. Live Match Updates
Poll live match data for in-progress predictions:
```typescript
// In prediction detail page
const liveData = await fetch(`/api/serpapi/match?query=${homeTeam} vs ${awayTeam}&live=true`)
  .then(r => r.json());
```

### 3. Real-Time Standings
Show current league table on dashboard:
```typescript
const standings = await fetch('/api/serpapi/standings?league=Premier League')
  .then(r => r.json());
```

### 4. Team Form Analysis
Enhance AI predictions with recent form:
```typescript
const recentResults = await serpApiSports.getRecentResults('Manchester United F.C.');
const form = recentResults.slice(0, 5); // Last 5 games
```

### 5. Video Highlights
Display match highlights for completed predictions:
```typescript
const highlights = await serpApiSports.getMatchHighlights('Liverpool vs Arsenal');
if (highlights) {
  // Show video player with highlights.link
}
```

## Rate Limits

Free tier: 100 searches/month
- Cache results where possible
- Use wisely for popular matches/teams
- Consider upgrading for production use

## Error Handling

The service gracefully handles errors:
- Returns `null` for failed requests
- Logs errors to console
- Checks configuration before making requests

## TypeScript Types

```typescript
import type { 
  SportsResults, 
  GameInfo, 
  TeamInfo, 
  StandingsResults 
} from '@/lib/serpapi-sports';
```

## Next Steps

1. **Get API Key**: Sign up at https://serpapi.com/
2. **Add to .env**: Set `SERPAPI_API_KEY`
3. **Test Endpoints**: Try fetching team data
4. **Integrate UI**: Update prediction forms to use real data
5. **Enable Features**: Add live scores, highlights, standings

## Support

- Documentation: https://serpapi.com/sports-results
- Playground: https://serpapi.com/playground
- Libraries: Available for Ruby, Python, Node.js, etc.
