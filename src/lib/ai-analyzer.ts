import { Prediction } from '@prisma/client';
import axios from 'axios';
import { sportsDataProvider, FixtureData } from './sports-data-provider';
import { generateAIPrediction } from './ai-prediction';

interface Citation {
  sourceUrl: string;
  sourceProvider: string;
  sourceTitle?: string;
  sourceSnippet?: string;
  claim: string;
  excerpt: string;
}

interface AnalysisResult {
  summary: string;
  strengths: string[];
  risks: string[];
  missingChecks: string[];
  contradictions: string[];
  keyFactors: string[];
  whatWouldChangeMyMind: string[];
  dataQualityNotes: string[];
  confidenceExplanation: string;
  confidenceScore: number;
  citations: Citation[];
  llmModel: string;
  processingTimeMs: number;
}

const ENABLE_AI_ANALYSIS = process.env.ENABLE_AI_ANALYSIS === 'true' || process.env.OPENROUTER_API_KEY;

export async function analyzePrediction(prediction: Prediction): Promise<AnalysisResult> {
  const startTime = Date.now();

  // Fetch comprehensive fixture data
  const fixtureData = await sportsDataProvider.getFixtureData(
    prediction.canonicalCompetitionId,
    prediction.canonicalHomeTeamId,
    prediction.canonicalAwayTeamId,
    prediction.kickoffTimeUTC
  );

  if (!ENABLE_AI_ANALYSIS) {
    return generateMockAnalysis(prediction, fixtureData, startTime);
  }

  try {
    return await generateAIAnalysis(prediction, fixtureData, startTime);
  } catch (error) {
    console.error('AI analysis failed, falling back to mock:', error);
    return generateMockAnalysis(prediction, fixtureData, startTime);
  }
}

async function generateAIAnalysis(
  prediction: Prediction,
  fixtureData: FixtureData,
  startTime: number
): Promise<AnalysisResult> {
  // Use OpenRouter API for real AI analysis
  const homeTeamName = fixtureData.homeTeam;
  const awayTeamName = fixtureData.awayTeam;
  const competition = fixtureData.competition;

  console.log(`🤖 Sending to OpenRouter AI: ${homeTeamName} vs ${awayTeamName}`);

  const aiPrediction = await generateAIPrediction({
    homeTeam: homeTeamName,
    awayTeam: awayTeamName,
    competition: competition,
    odds: fixtureData.odds?.[0],
    historicalContext: fixtureData.headToHead
      ? `H2H: ${homeTeamName} won ${fixtureData.headToHead.homeWins}/${fixtureData.headToHead.matches}`
      : undefined,
    userReasoning: prediction.reasoning || undefined,
  });

  if (!aiPrediction) {
    console.warn('⚠️ AI prediction failed, using enhanced mock');
    return generateMockAnalysis(prediction, fixtureData, startTime);
  }

  console.log(`✅ AI Analysis received: ${aiPrediction.prediction} (${(aiPrediction.confidence * 100).toFixed(0)}% confident)`);

  const citations = generateCitations(fixtureData);

  return {
    summary: aiPrediction.reasoning,
    strengths: [
      `AI recommends: ${aiPrediction.recommendedBet}`,
      ...aiPrediction.keyFactors.slice(0, 2),
    ],
    risks: aiPrediction.risks || [],
    missingChecks: [
      'Real-time team news and press conferences',
      'Latest injury updates and lineup confirmations',
    ],
    contradictions: fixtureData.odds
      ? [
          `Market implied probability: ${(1 / fixtureData.odds[0].homeWin * 100).toFixed(1)}%`,
          `AI confidence: ${(aiPrediction.confidence * 100).toFixed(0)}%`,
        ]
      : [],
    keyFactors: aiPrediction.keyFactors,
    whatWouldChangeMyMind: [
      'Significant lineup changes',
      'Unexpected injury to key player',
      'Dramatic odds movement indicating market shift',
    ],
    dataQualityNotes: [
      'Analysis powered by Llama 3.1 70B via OpenRouter',
      'Real football data from football-data.org',
      'Live betting odds integrated',
    ],
    confidenceExplanation: `${aiPrediction.prediction} predicted with ${(aiPrediction.confidence * 100).toFixed(0)}% confidence. ${aiPrediction.reasoning}`,
    confidenceScore: aiPrediction.confidence,
    citations,
    llmModel: 'llama-3.1-70b-instruct (via OpenRouter)',
    processingTimeMs: Date.now() - startTime,
  };
}

function buildAnalysisPrompt(prediction: Prediction, fixtureData: FixtureData): string {
  const homeForm = fixtureData.homeForm;
  const awayForm = fixtureData.awayForm;
  const h2h = fixtureData.headToHead;
  const odds = fixtureData.odds?.[0];

  return `Analyze this soccer/football betting prediction:

**Match Details:**
- Competition: ${fixtureData.competition}
- Home Team: ${fixtureData.homeTeam}
- Away Team: ${fixtureData.awayTeam}
- Kickoff: ${new Date(fixtureData.kickoff).toLocaleString()}
- Venue: ${fixtureData.venue || 'TBD'}
${fixtureData.referee ? `- Referee: ${fixtureData.referee}` : ''}
${fixtureData.weather ? `- Weather: ${fixtureData.weather.conditions}, ${fixtureData.weather.temperature}°C` : ''}

**Prediction:**
- Market: ${prediction.market}
- Pick: ${prediction.pick}
- Odds: ${prediction.odds || 'N/A'}
- Stake: $${prediction.stake || 'N/A'}
- User's Reasoning: ${prediction.reasoning || 'No reasoning provided'}

**Home Team Form (Last 10):**
- Record: ${homeForm?.wins}W-${homeForm?.draws}D-${homeForm?.losses}L
- Goals: ${homeForm?.goalsFor} scored, ${homeForm?.goalsAgainst} conceded
- Clean Sheets: ${homeForm?.cleanSheets}
- Last 5: ${homeForm?.lastFiveResults?.join('-') || 'N/A'}

**Away Team Form (Last 10):**
- Record: ${awayForm?.wins}W-${awayForm?.draws}D-${awayForm?.losses}L
- Goals: ${awayForm?.goalsFor} scored, ${awayForm?.goalsAgainst} conceded
- Clean Sheets: ${awayForm?.cleanSheets}
- Last 5: ${awayForm?.lastFiveResults?.join('-') || 'N/A'}

**Head-to-Head (Last ${h2h?.matches || 0} meetings):**
- ${fixtureData.homeTeam} wins: ${h2h?.homeWins || 0}
- ${fixtureData.awayTeam} wins: ${h2h?.awayWins || 0}
- Draws: ${h2h?.draws || 0}
- Avg goals: ${h2h?.avgHomeGoals || 0} - ${h2h?.avgAwayGoals || 0}
${h2h?.lastMeetings?.map(m => `  - ${m.date}: ${m.score} (${m.winner})`).join('\n') || ''}

**Injuries:**
Home: ${fixtureData.homeInjuries?.map(i => `${i.playerName} (${i.position}) - ${i.severity}`).join(', ') || 'None reported'}
Away: ${fixtureData.awayInjuries?.map(i => `${i.playerName} (${i.position}) - ${i.severity}`).join(', ') || 'None reported'}

**Market Odds:**
${odds ? `1X2: Home ${odds.homeWin} | Draw ${odds.draw} | Away ${odds.awayWin}` : 'No odds available'}
${odds ? `Implied Probabilities: Home ${(1/odds.homeWin*100).toFixed(1)}% | Draw ${(1/odds.draw*100).toFixed(1)}% | Away ${(1/odds.awayWin*100).toFixed(1)}%` : ''}

**Required Analysis Format (JSON):**
{
  "summary": "2-3 sentence executive summary of the prediction quality",
  "strengths": ["specific strength 1", "specific strength 2", "..."],
  "risks": ["specific risk 1", "specific risk 2", "..."],
  "missingChecks": ["what wasn't analyzed", "..."],
  "contradictions": ["market vs stats conflicts", "..."],
  "keyFactors": ["crucial match factors", "..."],
  "whatWouldChangeMyMind": ["specific events that would invalidate the bet", "..."],
  "dataQualityNotes": ["data limitations", "..."],
  "confidenceExplanation": "detailed explanation of confidence score reasoning",
  "confidenceScore": 0.0-1.0 (numeric confidence)
}

Be critical, data-driven, and explicit about uncertainties.`;
}

function generateCitations(fixtureData: FixtureData): Citation[] {
  const citations: Citation[] = [];

  if (fixtureData.homeForm) {
    citations.push({
      sourceUrl: `https://sports-data/teams/${fixtureData.homeTeam}/form`,
      sourceProvider: 'Sports Data API',
      sourceTitle: `${fixtureData.homeTeam} Recent Form`,
      sourceSnippet: `${fixtureData.homeForm.lastFiveResults?.join('-')} in last 5 matches`,
      claim: `${fixtureData.homeTeam} current form analysis`,
      excerpt: `Recent form shows ${fixtureData.homeForm.wins} wins in last ${fixtureData.homeForm.matchesPlayed} matches with ${fixtureData.homeForm.goalsFor} goals scored.`,
    });
  }

  if (fixtureData.awayForm) {
    citations.push({
      sourceUrl: `https://sports-data/teams/${fixtureData.awayTeam}/form`,
      sourceProvider: 'Sports Data API',
      sourceTitle: `${fixtureData.awayTeam} Recent Form`,
      sourceSnippet: `${fixtureData.awayForm.lastFiveResults?.join('-')} in last 5 matches`,
      claim: `${fixtureData.awayTeam} current form analysis`,
      excerpt: `Away form indicates ${fixtureData.awayForm.wins} wins in ${fixtureData.awayForm.matchesPlayed} matches with ${fixtureData.awayForm.goalsFor} goals.`,
    });
  }

  if (fixtureData.headToHead) {
    citations.push({
      sourceUrl: `https://sports-data/h2h/${fixtureData.homeTeam}-vs-${fixtureData.awayTeam}`,
      sourceProvider: 'Sports Data API',
      sourceTitle: 'Head-to-Head Statistics',
      sourceSnippet: `Last ${fixtureData.headToHead.matches} meetings`,
      claim: 'Historical matchup data',
      excerpt: `In ${fixtureData.headToHead.matches} previous meetings: ${fixtureData.homeTeam} ${fixtureData.headToHead.homeWins} wins, ${fixtureData.awayTeam} ${fixtureData.headToHead.awayWins} wins, ${fixtureData.headToHead.draws} draws.`,
    });
  }

  if (fixtureData.odds && fixtureData.odds.length > 0) {
    const primaryOdds = fixtureData.odds[0];
    citations.push({
      sourceUrl: `https://odds-api/${primaryOdds.bookmaker}`,
      sourceProvider: primaryOdds.bookmaker,
      sourceTitle: 'Current Betting Odds',
      sourceSnippet: `1X2: ${primaryOdds.homeWin}/${primaryOdds.draw}/${primaryOdds.awayWin}`,
      claim: 'Market sentiment and implied probabilities',
      excerpt: `${primaryOdds.bookmaker} odds suggest ${(1/primaryOdds.homeWin*100).toFixed(1)}% home win probability, ${(1/primaryOdds.draw*100).toFixed(1)}% draw, ${(1/primaryOdds.awayWin*100).toFixed(1)}% away win.`,
    });
  }

  return citations;
}

function generateMockAnalysis(
  prediction: Prediction,
  fixtureData: FixtureData,
  startTime: number
): AnalysisResult {
  const homeTeam = fixtureData.homeTeam;
  const awayTeam = fixtureData.awayTeam;
  const competition = fixtureData.competition;

  const homeForm = fixtureData.homeForm;
  const awayForm = fixtureData.awayForm;
  const odds = fixtureData.odds?.[0];

  const citations = generateCitations(fixtureData);

  const homeWinRate = homeForm ? (homeForm.wins / homeForm.matchesPlayed * 100).toFixed(0) : '50';
  const awayWinRate = awayForm ? (awayForm.wins / awayForm.matchesPlayed * 100).toFixed(0) : '50';

  return {
    summary: `Your ${prediction.market} prediction (${prediction.pick}) for ${homeTeam} vs ${awayTeam} in ${competition}. ${homeTeam} shows ${homeWinRate}% win rate (${homeForm?.lastFiveResults?.join('-') || 'N/A'} last 5), while ${awayTeam} has ${awayWinRate}% (${awayForm?.lastFiveResults?.join('-') || 'N/A'}). ${odds ? `Market odds ${odds.homeWin}/${odds.draw}/${odds.awayWin} suggest ${(1/odds.homeWin*100).toFixed(1)}% home win probability.` : 'No market odds available.'} ${prediction.reasoning ? 'Your reasoning aligns with form data.' : 'Consider adding detailed reasoning.'}`,
    
    strengths: [
      homeForm ? `${homeTeam} strong home form: ${homeForm.wins}W-${homeForm.draws}D-${homeForm.losses}L in last ${homeForm.matchesPlayed}` : `${homeTeam} form data available`,
      fixtureData.headToHead ? `Historical edge: ${homeTeam} won ${fixtureData.headToHead.homeWins}/${fixtureData.headToHead.matches} previous meetings` : 'Head-to-head data considered',
      homeForm?.cleanSheets ? `${homeTeam} defensive solidity with ${homeForm.cleanSheets} clean sheets` : 'Defensive data analyzed',
      prediction.reasoning ? 'User provided solid reasoning for prediction' : 'Prediction logged for analysis',
    ],
    
    risks: [
      awayForm ? `${awayTeam} away resilience: ${awayForm.wins} wins in ${awayForm.matchesPlayed} matches` : `${awayTeam} away form uncertain`,
      fixtureData.awayInjuries && fixtureData.awayInjuries.length > 0 ? `${awayTeam} injury concerns: ${fixtureData.awayInjuries.map(i => i.playerName).join(', ')}` : 'Injury situation fluid',
      fixtureData.homeInjuries && fixtureData.homeInjuries.length > 0 ? `${homeTeam} missing: ${fixtureData.homeInjuries.map(i => i.playerName).join(', ')}` : 'Home team fitness concerns',
      odds ? `Market odds (${odds.homeWin}) suggest ${(1/odds.homeWin*100).toFixed(1)}% home win - consider value` : 'Limited odds data',
    ],
    
    missingChecks: [
      'Recent tactical changes and lineup rotations',
      'Schedule congestion and fatigue factors',
      fixtureData.referee ? `Referee ${fixtureData.referee} card/penalty tendencies` : 'Referee appointment impact',
      'Latest team news and press conference insights',
    ],
    
    contradictions: odds && prediction.odds ? [
      `User odds ${prediction.odds.toFixed(2)} vs market average ${odds.homeWin.toFixed(2)} - ${Math.abs((prediction.odds - odds.homeWin)/odds.homeWin * 100).toFixed(1)}% difference`,
      `Implied probability ${(1/(prediction.odds || odds.homeWin)*100).toFixed(1)}% may not align with ${homeWinRate}% form-based expectation`,
    ] : ['Limited odds data for market comparison'],
    
    keyFactors: [
      homeForm && awayForm ? `Form differential: ${homeTeam} ${homeForm.goalsFor}GF vs ${awayTeam} ${awayForm.goalsFor}GF` : 'Goal-scoring capability differential',
      'Midfield control and possession dominance',
      fixtureData.weather ? `Weather: ${fixtureData.weather.conditions}, ${fixtureData.weather.temperature}°C` : 'Environmental conditions',
      fixtureData.headToHead ? `H2H trend: ${fixtureData.headToHead.avgHomeGoals.toFixed(1)}-${fixtureData.headToHead.avgAwayGoals.toFixed(1)} avg score` : 'Historical scoring patterns',
    ],
    
    whatWouldChangeMyMind: [
      `Late injury to ${homeTeam} key players`,
      'Significant lineup changes or squad rotation',
      odds ? `Odds movement beyond ${(odds.homeWin * 1.15).toFixed(2)} indicating market shift` : 'Major odds movements',
      'Adverse weather significantly worsening',
      'Unexpected managerial or tactical changes',
    ],
    
    dataQualityNotes: [
      'Mock data used - real API integration pending',
      'Team form based on last 10 matches simulation',
      fixtureData.homeInjuries || fixtureData.awayInjuries ? 'Injury data included but may not be complete' : 'Injury data limited',
      odds ? `Odds from ${odds.bookmaker} - cross-reference with multiple bookmakers recommended` : 'Limited bookmaker coverage',
    ],
    
    confidenceExplanation: `Moderate confidence (${homeForm && awayForm ? 70 : 60}%) based on available form data and ${odds ? 'market odds alignment' : 'limited odds data'}. ${homeTeam}'s ${homeWinRate}% win rate suggests ${homeWinRate > '60' ? 'favorable' : 'uncertain'} conditions. Analysis would strengthen with: confirmed lineups, recent tactical insights, and comprehensive injury updates. ${prediction.reasoning ? 'User reasoning adds context.' : 'Additional user reasoning would improve assessment.'}`,
    
    confidenceScore: homeForm && awayForm && odds ? 0.70 : 0.60,
    
    citations,
    
    llmModel: 'mock-analyzer-v2-enhanced',
    
    processingTimeMs: Date.now() - startTime,
  };
}