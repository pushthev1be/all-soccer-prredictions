import { Prediction } from '@prisma/client';
import axios from 'axios';
import { sportsDataProvider, FixtureData } from './sports-data-provider';
import { generateAIPrediction } from './ai-prediction';
import { normalizeTeamName, getTeamId } from './team-normalizer';
import { serpApiAggregator, AggregatedMatchData } from './serpapi-aggregator';
import { serpApiSports } from './serpapi-sports';

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
  // Enhanced fields - restructured for maximum decision-making impact
  teamComparison?: {
    home: {
      name: string;
      ranking: string;
      seasonForm: string;
      recentForm: string;
      injuries: string;
      twitterBuzz: string;
      headToHead: string;
    };
    away: {
      name: string;
      ranking: string;
      seasonForm: string;
      recentForm: string;
      injuries: string;
      twitterBuzz: string;
      headToHead: string;
    };
  };
  marketInsight?: {
    impliedProbability: string;
    odds: {
      homeWin?: number;
      draw?: number;
      awayWin?: number;
    };
    valueAssessment?: string;
  };
  tacticalAnalysis?: {
    strengths: {
      [team: string]: string[];
    };
    weaknesses: {
      [team: string]: string[];
    };
    bottomLine: string;
  };
}

const ENABLE_AI_ANALYSIS = process.env.ENABLE_AI_ANALYSIS === 'true' || process.env.OPENROUTER_API_KEY;

function canonicalIdToName(id: string): string {
  return (id || '').replace('custom:', '').replace(/-/g, ' ').trim();
}

export async function analyzePrediction(prediction: Prediction): Promise<AnalysisResult> {
  const startTime = Date.now();

  // PRIMARY: Use SerpAPI aggregated data (live, comprehensive, multi-source)
  const homeTeamName = normalizeTeamName(prediction.canonicalHomeTeamId.replace('custom:', '').replace(/-/g, ' '));
  const awayTeamName = normalizeTeamName(prediction.canonicalAwayTeamId.replace('custom:', '').replace(/-/g, ' '));
  
  let serpData: AggregatedMatchData | null = null;
  
  if (serpApiAggregator.isConfigured()) {
    console.log('🔥 Using SerpAPI as PRIMARY data source (gambling mode activated)');
    serpData = await serpApiAggregator.aggregateMatchData(
      homeTeamName,
      awayTeamName,
      prediction.canonicalCompetitionId.replace('custom:', '').replace(/-/g, ' ')
    );
  } else {
    console.log('⚠️ SerpAPI not configured - falling back to Football-Data.org');
  }

  // FALLBACK: Fetch basic fixture data from football-data.org
  const fixtureData = await sportsDataProvider.getFixtureData(
    prediction.canonicalCompetitionId,
    prediction.canonicalHomeTeamId,
    prediction.canonicalAwayTeamId,
    prediction.kickoffTimeUTC
  );

  if (!ENABLE_AI_ANALYSIS) {
    return generateMockAnalysis(prediction, fixtureData, startTime, serpData);
  }

  try {
    return await generateAIAnalysis(prediction, fixtureData, startTime, serpData);
  } catch (error) {
    console.error('AI analysis failed, falling back to mock:', error);
    return generateMockAnalysis(prediction, fixtureData, startTime, serpData);
  }
}

async function generateAIAnalysis(
  prediction: Prediction,
  fixtureData: FixtureData,
  startTime: number,
  serpData: AggregatedMatchData | null
): Promise<AnalysisResult> {
  // Normalize team names for consistent IDs and prompts
  const homeTeamName = normalizeTeamName(fixtureData.homeTeam || canonicalIdToName(prediction.canonicalHomeTeamId));
  const awayTeamName = normalizeTeamName(fixtureData.awayTeam || canonicalIdToName(prediction.canonicalAwayTeamId));
  const competition = fixtureData.competition || canonicalIdToName(prediction.canonicalCompetitionId);

  const homeTeamId = getTeamId(homeTeamName);
  const awayTeamId = getTeamId(awayTeamName);

  console.log(`🎲 GAMBLING MODE AI: Analyzing ${homeTeamName} vs ${awayTeamName}`);
  
  if (!homeTeamId || !awayTeamId) {
    console.log(`ℹ️  Team IDs missing - homeId:${homeTeamId} awayId:${awayTeamId} (normalized names used)`);
  }

  // Build enhanced context with SerpAPI data
  const enrichedContext = serpData ? buildSerpAPIContext(serpData) : '';

  const aiPrediction = await generateAIPrediction({
    homeTeam: homeTeamName,
    awayTeam: awayTeamName,
    competition: competition,
    odds: fixtureData.odds,
    historicalContext: fixtureData.headToHead
      ? `H2H: ${homeTeamName} won ${fixtureData.headToHead.homeWins}/${fixtureData.headToHead.matches}`
      : undefined,
    userReasoning: prediction.reasoning || undefined,
    // NEW: Pass SerpAPI enriched data
    serpApiContext: enrichedContext,
    gamblingMode: true, // NEW: Signal aggressive betting analysis
  });

  if (!aiPrediction) {
    console.error('❌ AI prediction failed - no mock fallback');
    throw new Error('AI analysis unavailable - please configure OPENROUTER_API_KEY');
  }

  console.log(`✅ BETTING ANALYSIS: ${aiPrediction.prediction} (${(aiPrediction.confidence * 100).toFixed(0)}% confident) - ${aiPrediction.recommendedBet}`);

  const citations = generateCitations(fixtureData, serpData);

  // Enhanced gambling-focused analysis
  const gamblingInsights = serpData ? extractGamblingInsights(serpData) : null;

  return {
    summary: `🎯 ${aiPrediction.reasoning}\n\n💰 RECOMMENDED BET: ${aiPrediction.recommendedBet}\n${serpData ? `\n📊 MARKET MOOD: ${serpData.marketMood}` : ''}`,
    
    strengths: [
      `🔥 AI PLAY: ${aiPrediction.recommendedBet}`,
      ...(serpData?.confidenceSignals || []),
      ...aiPrediction.keyFactors.slice(0, 2),
    ],
    
    risks: [
      ...(serpData?.riskFactors || []),
      ...(aiPrediction.risks || []),
    ],
    
    missingChecks: [
      'Last-minute lineup changes (check 1h before kickoff)',
      'Weather conditions at venue',
      'Referee assignment and card history',
    ],
    
    contradictions: [
      ...(fixtureData.odds
        ? [
            `🎰 Market odds: Home ${fixtureData.odds.homeWin} | Draw ${fixtureData.odds.draw} | Away ${fixtureData.odds.awayWin}`,
            `🤖 AI confidence: ${(aiPrediction.confidence * 100).toFixed(0)}%`,
            serpData ? `📱 Social sentiment: ${serpData.twitter.sentiment.toUpperCase()}` : '',
          ].filter(Boolean)
        : []),
    ],
    
    keyFactors: [
      ...aiPrediction.keyFactors,
      ...(serpData?.pressurePoints || []),
    ],
    
    whatWouldChangeMyMind: [
      '🚨 Key player ruled out in final team news',
      '💸 Sharp money moves odds significantly',
      '⚠️ Unexpected weather impact (heavy rain/wind)',
      '📉 Late injury report changes team strength',
    ],
    
    dataQualityNotes: [
      serpData ? '🔥 Enhanced with SerpAPI multi-source intelligence' : '⚠️ Limited to Football-Data.org only',
      '🤖 Powered by Mistral 7B (OpenRouter)',
      serpData?.news ? `📰 ${serpData.news.length} recent news articles analyzed` : '',
      serpData?.twitter ? `📱 ${serpData.twitter.results.length} social signals processed` : '',
    ].filter(Boolean),
    
    confidenceExplanation: `${aiPrediction.prediction} with ${(aiPrediction.confidence * 100).toFixed(0)}% confidence. ${aiPrediction.reasoning}${gamblingInsights ? `\n\n${gamblingInsights.explanation}` : ''}`,
    
    confidenceScore: aiPrediction.confidence,
    citations,
    llmModel: 'mistral-7b-instruct (OpenRouter) + SerpAPI Multi-Source',
    processingTimeMs: Date.now() - startTime,

    // CRITICAL DECISION DATA - Consolidated for maximum impact
    teamComparison: {
      // Row 1: Home Team - All critical stats in one view
      home: {
        name: homeTeamName,
        ranking: serpData?.homeTeamRanking || 'N/A',
        seasonForm: fixtureData.homeForm ? `${fixtureData.homeForm.wins}W-${fixtureData.homeForm.draws}D-${fixtureData.homeForm.losses}L (${fixtureData.homeForm.goalsFor}:${fixtureData.homeForm.goalsAgainst} GD)` : 'N/A',
        recentForm: serpData?.recentForm.home.map(g => g.status).join(' → ') || fixtureData.homeForm?.lastFiveResults?.join('') || 'N/A',
        injuries: fixtureData.homeInjuries?.length ? fixtureData.homeInjuries.map(i => `${i.playerName} (${i.position})`).join(', ') : 'None reported',
        twitterBuzz: serpData?.twitter.sentiment === 'bullish' && serpData.twitter.results.some(t => t.snippet.toLowerCase().includes(homeTeamName.toLowerCase())) 
          ? serpData.twitter.results.find(t => t.snippet.toLowerCase().includes(homeTeamName.toLowerCase()))?.snippet.substring(0, 80) + '...' || 'Low social interest'
          : 'Low social interest',
        headToHead: fixtureData.headToHead ? `${fixtureData.headToHead.homeWins}W-${fixtureData.headToHead.draws}D-${fixtureData.headToHead.awayWins}L (${fixtureData.headToHead.matches} games)` : 'No H2H data',
      },
      // Row 2: Away Team - All critical stats in one view
      away: {
        name: awayTeamName,
        ranking: serpData?.awayTeamRanking || 'N/A',
        seasonForm: fixtureData.awayForm ? `${fixtureData.awayForm.wins}W-${fixtureData.awayForm.draws}D-${fixtureData.awayForm.losses}L (${fixtureData.awayForm.goalsFor}:${fixtureData.awayForm.goalsAgainst} GD)` : 'N/A',
        recentForm: serpData?.recentForm.away.map(g => g.status).join(' → ') || fixtureData.awayForm?.lastFiveResults?.join('') || 'N/A',
        injuries: fixtureData.awayInjuries?.length ? fixtureData.awayInjuries.map(i => `${i.playerName} (${i.position})`).join(', ') : 'None reported',
        twitterBuzz: serpData?.twitter.sentiment === 'bullish' && serpData.twitter.results.some(t => t.snippet.toLowerCase().includes(awayTeamName.toLowerCase())) 
          ? serpData.twitter.results.find(t => t.snippet.toLowerCase().includes(awayTeamName.toLowerCase()))?.snippet.substring(0, 80) + '...' || 'Low social interest'
          : 'Low social interest',
        headToHead: fixtureData.headToHead ? `${fixtureData.headToHead.awayWins}W-${fixtureData.headToHead.draws}D-${fixtureData.headToHead.homeWins}L (${fixtureData.headToHead.matches} games)` : 'No H2H data',
      },
    },
    
    // Market odds with clear value indicators
    marketInsight: fixtureData.odds ? {
      impliedProbability: `Home ${(1/fixtureData.odds.homeWin*100).toFixed(1)}% | Draw ${(1/fixtureData.odds.draw*100).toFixed(1)}% | Away ${(1/fixtureData.odds.awayWin*100).toFixed(1)}%`,
      odds: {
        homeWin: fixtureData.odds.homeWin,
        draw: fixtureData.odds.draw,
        awayWin: fixtureData.odds.awayWin,
      },
      valueAssessment: aiPrediction.confidence > 0.7 ? '🔥 High confidence pick - market may be undervaluing this' : aiPrediction.confidence > 0.5 ? '✅ Moderate edge detected' : '⚠️ Coin flip - avoid or go small',
    } : undefined,
    
    // TACTICAL ANALYSIS - Actual strengths and weaknesses breakdown
    tacticalAnalysis: {
      strengths: {
        [homeTeamName]: [
          fixtureData.homeForm && fixtureData.homeForm.goalsFor > fixtureData.homeForm.goalsAgainst ? `Strong attack (${fixtureData.homeForm.goalsFor} goals scored)` : null,
          fixtureData.homeForm && fixtureData.homeForm.goalsAgainst < 5 ? `Solid defense (${fixtureData.homeForm.goalsAgainst} conceded)` : null,
          serpData && serpData.recentForm?.home && serpData.recentForm.home.filter(g => g.status === 'W').length >= 3 ? `Momentum: ${serpData.recentForm.home.filter(g => g.status === 'W').length} wins in last 5` : null,
          fixtureData.headToHead && fixtureData.headToHead.homeWins > fixtureData.headToHead.awayWins ? `Historical dominance (${fixtureData.headToHead.homeWins}/${fixtureData.headToHead.matches} H2H wins)` : null,
        ].filter((item): item is string => item !== null),
        [awayTeamName]: [
          fixtureData.awayForm && fixtureData.awayForm.goalsFor > fixtureData.awayForm.goalsAgainst ? `Potent offense (${fixtureData.awayForm.goalsFor} goals scored)` : null,
          fixtureData.awayForm && fixtureData.awayForm.goalsAgainst < 5 ? `Defensive discipline (${fixtureData.awayForm.goalsAgainst} conceded)` : null,
          serpData && serpData.recentForm?.away && serpData.recentForm.away.filter(g => g.status === 'W').length >= 3 ? `Hot streak: ${serpData.recentForm.away.filter(g => g.status === 'W').length} wins recently` : null,
          fixtureData.headToHead && fixtureData.headToHead.awayWins > fixtureData.headToHead.homeWins ? `H2H advantage (${fixtureData.headToHead.awayWins}/${fixtureData.headToHead.matches} wins)` : null,
        ].filter((item): item is string => item !== null),
      },
      weaknesses: {
        [homeTeamName]: [
          fixtureData.homeForm && fixtureData.homeForm.losses >= 2 ? `⚠️ Poor form (${fixtureData.homeForm.losses} losses)` : null,
          fixtureData.homeInjuries && fixtureData.homeInjuries.length > 0 ? `🏥 Key injuries: ${fixtureData.homeInjuries.map(i => i.playerName).join(', ')}` : null,
          fixtureData.homeForm && fixtureData.homeForm.goalsAgainst > 10 ? `🚨 Leaky defense (${fixtureData.homeForm.goalsAgainst} conceded)` : null,
          serpData && serpData.riskFactors?.some(r => r.includes(homeTeamName)) ? serpData.riskFactors.find(r => r.includes(homeTeamName)) : null,
        ].filter((item): item is string => item !== null),
        [awayTeamName]: [
          fixtureData.awayForm && fixtureData.awayForm.losses >= 2 ? `⚠️ Struggling (${fixtureData.awayForm.losses} losses)` : null,
          fixtureData.awayInjuries && fixtureData.awayInjuries.length > 0 ? `🏥 Injury concerns: ${fixtureData.awayInjuries.map(i => i.playerName).join(', ')}` : null,
          fixtureData.awayForm && fixtureData.awayForm.goalsAgainst > 10 ? `🚨 Defensive issues (${fixtureData.awayForm.goalsAgainst} conceded)` : null,
          serpData && serpData.riskFactors?.some(r => r.includes(awayTeamName)) ? serpData.riskFactors.find(r => r.includes(awayTeamName)) : null,
        ].filter((item): item is string => item !== null),
      },
      bottomLine: aiPrediction.keyFactors[0] || 'Analysis based on available data',
    },
  };
}

/**
 * Build enhanced context string from SerpAPI data for AI
 */
function buildSerpAPIContext(serpData: AggregatedMatchData): string {
  const parts = [`LIVE INTELLIGENCE FROM SERPAPI:\n`];
  
  parts.push(`Market Mood: ${serpData.marketMood}`);
  parts.push(`Social Sentiment: ${serpData.twitter.sentiment.toUpperCase()}`);
  
  if (serpData.homeTeamRanking) parts.push(`Home Ranking: ${serpData.homeTeamRanking}`);
  if (serpData.awayTeamRanking) parts.push(`Away Ranking: ${serpData.awayTeamRanking}`);
  
  if (serpData.news.length > 0) {
    parts.push(`\nLATEST NEWS:`);
    serpData.news.slice(0, 3).forEach(n => {
      parts.push(`- ${n.title}: ${n.snippet.substring(0, 100)}...`);
    });
  }
  
  if (serpData.twitter.keyTopics.length > 0) {
    parts.push(`\nTRENDING TOPICS: ${serpData.twitter.keyTopics.join(', ')}`);
  }
  
  if (serpData.relatedQuestions.length > 0) {
    parts.push(`\nFAN QUESTIONS:`);
    serpData.relatedQuestions.slice(0, 2).forEach(q => {
      parts.push(`Q: ${q.question}`);
      if (q.answer) parts.push(`A: ${q.answer.substring(0, 100)}...`);
    });
  }
  
  return parts.join('\n');
}

/**
 * Extract gambling-specific insights from SerpAPI data
 */
function extractGamblingInsights(serpData: AggregatedMatchData): {
  explanation: string;
  edgeFound: boolean;
  marketBias: string;
} {
  const isBullish = serpData.twitter.sentiment === 'bullish';
  const hasNews = serpData.news.length > 3;
  const hasConfidence = serpData.confidenceSignals.length > 1;
  
  let explanation = '';
  let edgeFound = false;
  let marketBias = '';
  
  if (isBullish && hasConfidence) {
    explanation = '🔥 STRONG EDGE DETECTED: Market consensus + recent form aligned. This is a HAMMER bet.';
    edgeFound = true;
    marketBias = 'Public backing favorite heavy';
  } else if (!isBullish && hasNews) {
    explanation = '⚠️ CONTRARIAN PLAY: Public fading this, but fundamentals say otherwise. Consider fade.';
    edgeFound = true;
    marketBias = 'Market underestimating one side';
  } else {
    explanation = '⚖️ STANDARD ANALYSIS: No clear edge found. Stick to value betting principles.';
    marketBias = 'Market fairly efficient';
  }
  
  return { explanation, edgeFound, marketBias };
}

function buildAnalysisPrompt(prediction: Prediction, fixtureData: FixtureData): string {
  const homeForm = fixtureData.homeForm;
  const awayForm = fixtureData.awayForm;
  const h2h = fixtureData.headToHead;
  const odds = fixtureData.odds;

  return `Analyze this soccer/football betting prediction:

**Match Details:**
- Competition: ${fixtureData.competition}
- Home Team: ${fixtureData.homeTeam}
- Away Team: ${fixtureData.awayTeam}
- Kickoff: ${new Date(fixtureData.kickoff).toLocaleString()}
- Venue: ${fixtureData.venue || 'TBD'}

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

function generateCitations(fixtureData: FixtureData, serpData: AggregatedMatchData | null): Citation[] {
  const citations: Citation[] = [];

  // SerpAPI citations (priority)
  if (serpData) {
    if (serpData.sportsData) {
      citations.push({
        sourceUrl: 'https://serpapi.com/sports-results',
        sourceProvider: 'SerpAPI Sports Results',
        sourceTitle: 'Live Sports Data',
        claim: `Team rankings and live match data for ${serpData.homeTeam} vs ${serpData.awayTeam}`,
        excerpt: `Market mood: ${serpData.marketMood}`,
      });
    }

    serpData.news.slice(0, 2).forEach(article => {
      citations.push({
        sourceUrl: article.link,
        sourceProvider: article.source,
        sourceTitle: article.title,
        claim: 'Latest news and injury reports',
        excerpt: article.snippet.substring(0, 150) + '...',
      });
    });

    if (serpData.twitter.results.length > 0) {
      citations.push({
        sourceUrl: 'https://twitter.com',
        sourceProvider: 'Twitter/X Social Intelligence',
        sourceTitle: 'Fan Sentiment Analysis',
        claim: `Social sentiment: ${serpData.twitter.sentiment}`,
        excerpt: `Trending topics: ${serpData.twitter.keyTopics.slice(0, 3).join(', ')}`,
      });
    }

    serpData.topInsights.slice(0, 2).forEach(insight => {
      citations.push({
        sourceUrl: insight.source,
        sourceProvider: 'Expert Analysis',
        sourceTitle: insight.title,
        claim: 'Professional betting insights',
        excerpt: insight.snippet.substring(0, 150) + '...',
      });
    });
  }

  // Football-Data.org citations (fallback)
  if (fixtureData.homeForm) {
    citations.push({
      sourceUrl: 'https://www.football-data.org/',
      sourceProvider: 'Football-Data.org API',
      sourceTitle: 'Team Form & Statistics',
      claim: `${fixtureData.homeTeam}: ${fixtureData.homeForm.wins}W-${fixtureData.homeForm.draws}D-${fixtureData.homeForm.losses}L`,
      excerpt: `Last 5: ${fixtureData.homeForm.lastFiveResults?.join('') || 'N/A'}`,
    });
  }

  if (fixtureData.headToHead) {
    citations.push({
      sourceUrl: 'https://www.football-data.org/',
      sourceProvider: 'Football-Data.org API',
      sourceTitle: 'Head-to-Head Record',
      claim: `${fixtureData.homeTeam} ${fixtureData.headToHead.homeWins}/${fixtureData.headToHead.matches} vs ${fixtureData.awayTeam}`,
      excerpt: `Total matches: ${fixtureData.headToHead.matches} (${fixtureData.headToHead.homeWins}W-${fixtureData.headToHead.draws}D-${fixtureData.headToHead.awayWins}L)`,
    });
  }

  if (fixtureData.odds) {
    citations.push({
      sourceUrl: 'https://www.football-data.org/',
      sourceProvider: 'Football-Data.org Calculated Odds',
      sourceTitle: 'Betting Odds',
      claim: `Current market odds for ${fixtureData.homeTeam} vs ${fixtureData.awayTeam}`,
      excerpt: `Home ${fixtureData.odds.homeWin} | Draw ${fixtureData.odds.draw} | Away ${fixtureData.odds.awayWin}`,
    });
  }

  return citations;
}

function generateMockAnalysis(
  prediction: Prediction,
  fixtureData: FixtureData,
  startTime: number,
  serpData: AggregatedMatchData | null
): AnalysisResult {
  const homeTeam = fixtureData.homeTeam || 'Home Team';
  const awayTeam = fixtureData.awayTeam || 'Away Team';

  return {
    summary: `🎯 BETTING ANALYSIS: ${prediction.market} - ${prediction.pick}\n\n💰 This is a ${prediction.market} play. ${serpData ? `Market mood: ${serpData.marketMood}` : 'Configure SerpAPI for live market intelligence.'}`,
    
    strengths: [
      '🔥 Strong recent form indicators',
      ...(serpData?.confidenceSignals || ['📊 Configure SerpAPI for real-time signals']),
    ],
    
    risks: [
      ...(serpData?.riskFactors || ['⚠️ Limited data - add SerpAPI for comprehensive risk analysis']),
    ],
    
    missingChecks: [
      'Latest team news (1h before kickoff)',
      'Weather conditions',
      'Referee assignment',
    ],
    
    contradictions: [],
    
    keyFactors: [
      ...(serpData?.pressurePoints || ['Configure OPENROUTER_API_KEY for AI-powered analysis']),
    ],
    
    whatWouldChangeMyMind: [
      '🚨 Late lineup changes',
      '💸 Sharp money movement',
      '⚠️ Weather impact',
    ],
    
    dataQualityNotes: [
      '⚠️ AI analysis disabled - configure OPENROUTER_API_KEY',
      serpData ? '✅ SerpAPI multi-source data active' : '⚠️ Add SERPAPI_API_KEY for live intelligence',
    ],
    
    confidenceExplanation: 'AI analysis not available. Configure OPENROUTER_API_KEY to enable intelligent predictions.',
    confidenceScore: 0.5,
    citations: generateCitations(fixtureData, serpData),
    llmModel: 'Mock (AI disabled)',
    processingTimeMs: Date.now() - startTime,

    teamComparison: {
      home: {
        name: homeTeam,
        ranking: 'N/A',
        seasonForm: fixtureData.homeForm ? `${fixtureData.homeForm.wins}W-${fixtureData.homeForm.draws}D-${fixtureData.homeForm.losses}L (${fixtureData.homeForm.goalsFor}:${fixtureData.homeForm.goalsAgainst} GD)` : 'N/A',
        recentForm: fixtureData.homeForm?.lastFiveResults?.join('') || 'N/A',
        injuries: fixtureData.homeInjuries?.length ? fixtureData.homeInjuries.map(i => `${i.playerName} (${i.position})`).join(', ') : 'None reported',
        twitterBuzz: 'Configure SerpAPI for social intelligence',
        headToHead: fixtureData.headToHead ? `${fixtureData.headToHead.homeWins}W-${fixtureData.headToHead.draws}D-${fixtureData.headToHead.awayWins}L (${fixtureData.headToHead.matches} games)` : 'No H2H data',
      },
      away: {
        name: awayTeam,
        ranking: 'N/A',
        seasonForm: fixtureData.awayForm ? `${fixtureData.awayForm.wins}W-${fixtureData.awayForm.draws}D-${fixtureData.awayForm.losses}L (${fixtureData.awayForm.goalsFor}:${fixtureData.awayForm.goalsAgainst} GD)` : 'N/A',
        recentForm: fixtureData.awayForm?.lastFiveResults?.join('') || 'N/A',
        injuries: fixtureData.awayInjuries?.length ? fixtureData.awayInjuries.map(i => `${i.playerName} (${i.position})`).join(', ') : 'None reported',
        twitterBuzz: 'Configure SerpAPI for social intelligence',
        headToHead: fixtureData.headToHead ? `${fixtureData.headToHead.awayWins}W-${fixtureData.headToHead.draws}D-${fixtureData.headToHead.homeWins}L (${fixtureData.headToHead.matches} games)` : 'No H2H data',
      },
    },
    
    marketInsight: fixtureData.odds ? {
      impliedProbability: `Home ${(1/fixtureData.odds.homeWin*100).toFixed(1)}% | Draw ${(1/fixtureData.odds.draw*100).toFixed(1)}% | Away ${(1/fixtureData.odds.awayWin*100).toFixed(1)}%`,
      odds: {
        homeWin: fixtureData.odds.homeWin,
        draw: fixtureData.odds.draw,
        awayWin: fixtureData.odds.awayWin,
      },
      valueAssessment: '⚠️ Enable AI analysis for value assessment',
    } : undefined,
    
    tacticalAnalysis: {
      strengths: {
        [homeTeam]: [
          fixtureData.homeForm ? `Season record: ${fixtureData.homeForm.wins}W-${fixtureData.homeForm.draws}D-${fixtureData.homeForm.losses}L` : 'No form data',
        ],
        [awayTeam]: [
          fixtureData.awayForm ? `Season record: ${fixtureData.awayForm.wins}W-${fixtureData.awayForm.draws}D-${fixtureData.awayForm.losses}L` : 'No form data',
        ],
      },
      weaknesses: {
        [homeTeam]: ['Configure OPENROUTER_API_KEY for AI tactical analysis'],
        [awayTeam]: ['Configure OPENROUTER_API_KEY for AI tactical analysis'],
      },
      bottomLine: 'Enable AI analysis for comprehensive tactical breakdown',
    },
  };
}
