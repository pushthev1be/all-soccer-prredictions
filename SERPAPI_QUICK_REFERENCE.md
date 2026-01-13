# SerpAPI Quick Reference Card

## 🚀 Quick Start

```typescript
import { serpApiAggregator } from '@/lib/serpapi-aggregator';

// Get comprehensive match intelligence
const data = await serpApiAggregator.aggregateMatchData(
  'Manchester United',
  'Liverpool',
  'Premier League'
);

// Access aggregated data
console.log(data.marketMood);          // 🔥 STRONG BULLISH
console.log(data.twitter.sentiment);    // bullish/bearish/neutral
console.log(data.confidenceSignals);    // ['🔥 Home team on fire']
console.log(data.riskFactors);          // ['🎲 Upset potential']
```

## 💰 Cost Management

### Free Caching (Most Important!)
```typescript
// First request: Costs 6 searches
await aggregateMatchData('Team A', 'Team B');

// Within 1 hour: FREE (0 searches)
await aggregateMatchData('Team A', 'Team B'); // Cache hit!
```

**Free Tier Strategy:**
- 100 searches/month = 3 complete analyses/day
- Cache popular matches in morning
- All user traffic hits cache = FREE
- Reserve 20 searches for live updates

## 📊 Key Parameters

### Cache Control
```typescript
no_cache: 'false'  // Use cache (FREE after 1h) ✅ DEFAULT
no_cache: 'true'   // Force fresh (costs 1 search)
```

### Response Optimization
```typescript
json_restrictor: 'title,snippet,link,date,source'  // -70% size
```

### Time Filters
```typescript
tbs: 'qdr:d'  // Past day (breaking news)
tbs: 'qdr:w'  // Past week (match previews)
tbs: 'qdr:m'  // Past month (season trends)
```

### Search Types
```typescript
tbm: 'nws'   // Google News
// No tbm  = Regular web search
```

### Location
```typescript
location: 'United States'
hl: 'en'
gl: 'us'
```

## 🎯 Common Patterns

### Get Match Data (Full Intelligence)
```typescript
const matchData = await serpApiAggregator.aggregateMatchData(
  homeTeam,
  awayTeam,
  competition
);

// Returns:
{
  sportsData: { games, rankings, standings },
  twitter: { sentiment, keyTopics, results },
  news: NewsResult[],
  topInsights: TopInsight[],
  relatedQuestions: RelatedQuestion[],
  marketMood: string,
  pressurePoints: string[],
  confidenceSignals: string[],
  riskFactors: string[]
}
```

### Get Team Sports Data Only
```typescript
import { serpApiSports } from '@/lib/serpapi-sports';

const teamData = await serpApiSports.getTeamResults('Manchester United');
// Returns: { title, rankings, games, game_spotlight }
```

### Get Recent Form
```typescript
const recentGames = await serpApiSports.getRecentResults('Liverpool');
// Returns: GameInfo[] with completed matches
```

### Get Upcoming Fixtures
```typescript
const fixtures = await serpApiSports.getUpcomingFixtures('Arsenal');
// Returns: GameInfo[] with scheduled matches
```

## ⚡ Performance Tips

### 1. Pre-warm Cache for Popular Matches
```typescript
// Run before peak traffic (morning of game day)
const popularMatches = [
  ['Man United', 'Liverpool'],
  ['Arsenal', 'Chelsea'],
  ['Barcelona', 'Real Madrid'],
];

for (const [home, away] of popularMatches) {
  await serpApiAggregator.aggregateMatchData(home, away);
  await new Promise(r => setTimeout(r, 100)); // Rate limit
}

// All user requests within next hour = FREE
```

### 2. Batch Parallel Requests
```typescript
// DON'T: Sequential (slow)
for (const team of teams) {
  await getTeamData(team);
}

// DO: Parallel with limit
const batch = 3;
for (let i = 0; i < teams.length; i += batch) {
  await Promise.all(
    teams.slice(i, i + batch).map(t => getTeamData(t))
  );
}
```

### 3. Smart Update Intervals
```typescript
// Live games: 5 min intervals
if (isLive) {
  interval = 5 * 60000; // 12 searches/hour
}

// Pre-match: 1 hour intervals (cached)
else {
  interval = 60 * 60000; // Free from cache!
}
```

## 🔍 Data Extraction Examples

### Extract Sentiment
```typescript
const { twitter } = await aggregateMatchData('Team A', 'Team B');

if (twitter.sentiment === 'bullish') {
  console.log('📈 Public backing home team');
} else if (twitter.sentiment === 'bearish') {
  console.log('📉 Fade the public?');
}
```

### Find Injury News
```typescript
const { news, pressurePoints } = await aggregateMatchData(...);

const injuryNews = news.filter(n => 
  n.snippet.toLowerCase().includes('injury') ||
  n.snippet.toLowerCase().includes('injured')
);

const hasInjuryRisk = pressurePoints.some(p => 
  p.includes('🩹 Injury concerns')
);
```

### Detect Form Trends
```typescript
const { confidenceSignals } = await aggregateMatchData(...);

const isOnFire = confidenceSignals.some(s => 
  s.includes('🔥') && s.includes('wins')
);
```

## 🚨 Error Handling

### Check if Configured
```typescript
if (!serpApiAggregator.isConfigured()) {
  console.warn('SerpAPI not configured');
  return getFallbackData();
}
```

### Handle Individual Failures
```typescript
// Each endpoint has its own error handling
const data = await aggregateMatchData('Team A', 'Team B');

// Check what's available
if (data.news.length === 0) {
  console.warn('No news data available');
}

if (data.twitter.sentiment === 'neutral' && data.twitter.results.length === 0) {
  console.warn('No Twitter data');
}
```

### Rate Limit Detection
```typescript
// Automatic rate limiting built-in
// But if you get 429 errors:
if (error.status === 429) {
  // Wait and retry with exponential backoff
  await new Promise(r => setTimeout(r, 2 ** retryCount * 1000));
}
```

## 📈 Monitoring

### Track Usage
```typescript
let monthlySearches = 0;

function trackSearch() {
  monthlySearches++;
  console.log(`Searches: ${monthlySearches}/100 (${100 - monthlySearches} remaining)`);
  
  if (monthlySearches > 90) {
    console.warn('⚠️ Approaching monthly limit!');
  }
}
```

### Check Cache Performance
```typescript
const start = Date.now();
const data = await aggregateMatchData('Team A', 'Team B');
const latency = Date.now() - start;

if (latency < 500) {
  console.log('✅ Cache hit (fast response)');
} else {
  console.log('🔄 Fresh data (slower)');
}
```

## 🎲 Gambling Mode Integration

### In AI Analyzer
```typescript
import { analyzePrediction } from '@/lib/ai-analyzer';

const analysis = await analyzePrediction(prediction);

// Analysis includes:
// - SerpAPI multi-source context
// - Gambling-focused language
// - Edge detection
// - Market bias analysis
// - Confident recommendations
```

### In AI Prediction
```typescript
import { generateAIPrediction } from '@/lib/ai-prediction';

const result = await generateAIPrediction({
  ...predictionData,
  serpApiContext: JSON.stringify(matchData),
  gamblingMode: true,
});

// AI will use aggressive betting language
```

## 📚 Intelligence Types

### Market Mood
```
🔥 STRONG BULLISH - Market backing heavy
⚠️ BEARISH - Doubt in air
😴 QUIET - Low interest
⚖️ NEUTRAL - Split opinions
```

### Pressure Points
```
🩹 Injury concerns
🚫 Suspension issues
📉 Form worries
💥 High pressure situation
```

### Confidence Signals
```
🔥 Team on fire
📱 Social buzz
💪 Dominant narrative
📊 Expert consensus
```

### Risk Factors
```
🎲 Upset potential
🏥 Injury uncertainty
❓ Limited data
💸 Sharp money fading
```

## 🔗 Useful Links

- SerpAPI Dashboard: https://serpapi.com/dashboard
- API Documentation: https://serpapi.com/sports-results
- Playground: https://serpapi.com/playground
- Status: https://serpapi.com/status

## 💡 Pro Tips

1. **Cache is your friend** - It's FREE and fast
2. **Pre-warm popular matches** - Load cache before traffic
3. **Use exact match queries** - Better accuracy with quotes
4. **Filter by time** - Save quota on old data
5. **Batch requests** - Parallel > Sequential
6. **Monitor usage** - Track monthly quota
7. **Graceful degradation** - Handle partial data
8. **Test locally** - Playground for query testing

## 🆘 Common Issues

### "SerpAPI not configured"
```bash
# Add to .env
SERPAPI_API_KEY="your_key_here"

# Restart server
npm run dev
```

### "Rate limit exceeded"
```typescript
// Built-in rate limiting should prevent this
// If it happens, check:
console.log(config.minRequestInterval); // Should be >= 100ms
```

### "No results found"
```typescript
// Try alternative query
// Example: "Manchester United F.C." → "Man United"
// Or add location parameter
```

### Cache not working
```typescript
// Ensure no_cache is false (default)
// Check same query+params used
// Cache expires after 1 hour
```

## 🎓 Learning Resources

1. Read `SERPAPI_OPTIMIZATION.md` for deep dive
2. Check `GAMBLING_MODE.md` for AI integration
3. Review `SERPAPI_INTEGRATION.md` for API basics
4. See `src/lib/serpapi-aggregator.ts` for implementation

## 📞 Support

- GitHub Issues: (your repo)
- SerpAPI Support: support@serpapi.com
- Documentation: Full guides in project root
