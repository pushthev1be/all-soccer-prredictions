/**
 * Enhanced Feedback System for Soccer Predictions
 * Provides deeper analysis, validation, and actionable insights
 */

import { AnalysisResult } from './ai-analyzer';

export interface ConfidenceBreakdown {
  factors: Array<{
    name: string;
    score: number;
    weight: number;
  }>;
  calculatedConfidence: number;
  explanation: string;
}

export interface NumbersSummary {
  metrics: Record<string, string | number | null>;
  probabilities: Record<string, string | number | null>;
  valueIndicators: Record<string, string | number | null>;
}

export interface ComparativeAnalysis {
  similarMatches: string[];
  winRateInContext: string;
  publicVsSharp: {
    publicBetting: string;
    sharpMoney: string;
    divergence: string;
  };
  historicalOutcomes: string[];
}

export interface FeedbackValidation {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  qualityScore: number;
}

/**
 * Generate confidence breakdown explaining why confidence is at a certain level
 */
export function generateConfidenceBreakdown(
  confidence: number,
  dataCompleteness: number,
  serpDataAvailable: boolean
): ConfidenceBreakdown {
  const factors = [
    {
      name: 'Data Quality',
      score: Math.min(dataCompleteness / 100, 1),
      weight: 0.3,
    },
    {
      name: 'Historical Fit',
      score: serpDataAvailable ? 0.85 : 0.6,
      weight: 0.25,
    },
    {
      name: 'Market Alignment',
      score: confidence,
      weight: 0.2,
    },
    {
      name: 'Tactical Edge',
      score: Math.min(confidence + 0.1, 1),
      weight: 0.25,
    },
  ];

  const highestWeightFactor = factors.reduce((a, b) => (a.weight > b.weight ? a : b));

  return {
    factors,
    calculatedConfidence: confidence,
    explanation: `Heavily weighted toward ${highestWeightFactor.name} (${(highestWeightFactor.weight * 100).toFixed(0)}%) with ${dataCompleteness}% data completeness`,
  };
}

/**
 * Generate "What the Numbers Say" section
 */
export function generateNumbersSummary(
  homeTeam: string,
  awayTeam: string,
  homeForm: { goalsFor?: number; goalsAgainst?: number } | null,
  awayForm: { goalsFor?: number; goalsAgainst?: number } | null,
  odds?: { homeWin?: number; draw?: number; awayWin?: number }
): NumbersSummary {
  const calculateImpliedProbability = (odd: number | undefined) => {
    if (!odd) return null;
    return ((1 / odd) * 100).toFixed(1);
  };

  const calculateXGEstimate = (goalsFor?: number, goalsAgainst?: number) => {
    if (!goalsFor || !goalsAgainst) return null;
    return ((goalsFor + goalsAgainst) / 2).toFixed(2);
  };

  return {
    metrics: {
      [`${homeTeam} Goals/Match`]: homeForm?.goalsFor?.toFixed(2) ?? null,
      [`${awayTeam} Goals/Match`]: awayForm?.goalsFor?.toFixed(2) ?? null,
      [`${homeTeam} Goals Conceded/Match`]: homeForm?.goalsAgainst?.toFixed(2) ?? null,
      [`${awayTeam} Goals Conceded/Match`]: awayForm?.goalsAgainst?.toFixed(2) ?? null,
      [`Estimated xG Difference`]: homeForm && awayForm
        ? (
            (homeForm.goalsFor || 0) -
            (awayForm.goalsFor || 0) +
            (awayForm.goalsAgainst || 0) -
            (homeForm.goalsAgainst || 0)
          ).toFixed(2)
        : null,
    },
    probabilities: {
      [`Home Win (${odds?.homeWin})`]: calculateImpliedProbability(odds?.homeWin),
      [`Draw (${odds?.draw})`]: calculateImpliedProbability(odds?.draw),
      [`Away Win (${odds?.awayWin})`]: calculateImpliedProbability(odds?.awayWin),
      'Over 2.5 Goals': homeForm && awayForm ? calculateXGEstimate(homeForm.goalsFor, awayForm.goalsFor) : null,
    },
    valueIndicators: {
      'Odds Fair?': odds ? 'Compare your prediction vs implied probability' : 'No odds data',
      'Market Inefficiency': 'Look for divergence between true odds and market odds',
      'Sharp Action': 'Monitor for sharp money movement pre-match',
    },
  };
}

/**
 * Generate comparative analysis against similar historical cases
 */
export function generateComparativeAnalysis(
  homeTeam: string,
  awayTeam: string,
  confidence: number,
  odds?: { homeWin?: number; draw?: number; awayWin?: number }
): ComparativeAnalysis {
  const impliedProb = odds?.homeWin ? (1 / odds.homeWin) * 100 : null;

  return {
    similarMatches: [
      `When ${homeTeam} are favored with ${(confidence * 100).toFixed(0)}% model confidence`,
      `Against away teams with similar form trajectory as ${awayTeam}`,
      `In competitive matches with odds near ${odds?.homeWin?.toFixed(2)}`,
    ],
    winRateInContext: `Historical win rate for similar odds/form combinations: [Pending historical data integration]`,
    publicVsSharp: {
      publicBetting: `Typical public leans ${confidence > 0.55 ? 'heavily toward home teams' : 'toward value plays'}`,
      sharpMoney: `Sharp bettors target ${confidence > 0.65 ? 'live betting opportunities' : 'pregame inefficiencies'}`,
      divergence: `${confidence > 0.65 ? 'High divergence expected - public will likely fade' : 'Consensus play - less opportunity for edge'}`,
    },
    historicalOutcomes: [
      `Last 5 matches with similar context: [Pending live data]`,
      `Market accuracy when odds are ${odds?.homeWin?.toFixed(2)}: ~${(impliedProb || 55).toFixed(0)}%`,
    ],
  };
}

/**
 * Generate alternative analytical perspectives
 */
export function generateAlternativeViews(
  prediction: string,
  confidence: number,
  risks: string[],
  strengths: string[]
) {
  const bullishCore = `All structural advantages align with ${prediction}. ${strengths[0] || 'Team form is solid'}.`;
  const bearishCore = risks.length > 0 ? `${risks[0]} creates significant counterpoint to base case.` : 'No major flaws but odds might be right.';

  return {
    bullish: `${bullishCore} If this trend continues, expect ${prediction.toLowerCase()} with 70%+ confidence.`,
    bearish: `${bearishCore} Consider the fade if ${risks[1] || 'unexpected lineup changes'} occur.`,
    neutral: `Markets have priced this efficiently. No clear edge. Recommend small sizing or skip.`,
    contrarian: `Contrarian angle: The public consensus is wrong on ${prediction === 'Home Win' ? 'away team' : 'home team'} value.`,
  };
}

/**
 * Validate feedback quality and suggest improvements
 */
export function validateFeedback(analysis: AnalysisResult): FeedbackValidation {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for generic feedback
  const genericTerms = ['strong', 'good', 'solid', 'bad', 'poor', 'well'];
  const genericFound = [
    ...analysis.strengths,
    ...analysis.risks,
    ...(analysis.keyFactors || []),
  ].some((item) => genericTerms.some((term) => new RegExp(`\\b${term}\\b`, 'i').test(item)));

  if (genericFound) {
    issues.push('Contains generic terms without specific metrics');
    suggestions.push('Replace qualitative terms with concrete stats (e.g., "3 wins in 5" instead of "good form")');
  }

  // Check for data completeness
  if ((analysis.dataCompleteness ?? 0) < 35) {
    issues.push('Low data completeness suggests limited analysis depth');
    suggestions.push('Seek additional sources or extend time window for more context');
  }

  // Check for actionable triggers
  if (!analysis.whatWouldChangeMyMind?.length) {
    issues.push('No clear conditions for changing prediction');
    suggestions.push('Add specific "if-then" scenarios (e.g., "If Team A scores first, reassess at minute 25")');
  }

  // Check for confidence justification
  if (!analysis.confidenceExplanation) {
    issues.push('Confidence score lacks explanation');
    suggestions.push('Always explain why confidence is at X level based on specific factors');
  }

  // Calculate quality score
  const qualityScore = Math.max(0, 100 - issues.length * 20);

  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
    qualityScore,
  };
}

/**
 * Generate specific, actionable factors from fixture data
 */
export function generateSpecificFactors(
  homeTeam: string,
  awayTeam: string,
  homeForm: { goalsFor?: number; goalsAgainst?: number; wins?: number; matches?: number } | null,
  awayForm: { goalsFor?: number; goalsAgainst?: number; wins?: number; matches?: number } | null
) {
  const homeGoalsPerMatch = homeForm?.goalsFor ? (homeForm.goalsFor / (homeForm.matches || 5)).toFixed(2) : null;
  const awayGoalsPerMatch = awayForm?.goalsFor ? (awayForm.goalsFor / (awayForm.matches || 5)).toFixed(2) : null;
  const homeCleanSheetRate = homeForm
    ? (((homeForm.matches || 5) - (homeForm.goalsAgainst || 0)) / (homeForm.matches || 5) * 100).toFixed(1)
    : null;
  const awayCleanSheetRate = awayForm
    ? (((awayForm.matches || 5) - (awayForm.goalsAgainst || 0)) / (awayForm.matches || 5) * 100).toFixed(1)
    : null;

  return {
    strengths: [
      homeGoalsPerMatch ? `📈 ${homeTeam} averaging ${homeGoalsPerMatch} goals at home` : null,
      awayCleanSheetRate ? `🛡️ ${awayTeam} keeping clean sheets in ${awayCleanSheetRate}% of away matches` : null,
      homeForm?.wins ? `✅ ${homeTeam} with ${homeForm.wins} wins in recent form` : null,
    ].filter(Boolean),

    risks: [
      awayGoalsPerMatch ? `⚠️ ${awayTeam} averaging only ${awayGoalsPerMatch} goals away` : null,
      homeCleanSheetRate ? `🔴 ${homeTeam} conceding in ${(100 - parseFloat(homeCleanSheetRate || '0')).toFixed(0)}% of home matches` : null,
      `Referee and weather conditions could impact style of play`,
    ].filter(Boolean),
  };
}

/**
 * Smart polling interval based on time to match
 */
export function getSmartPollInterval(kickoffTimeUTC: string): number {
  const timeToKickoff = new Date(kickoffTimeUTC).getTime() - Date.now();
  const oneHourMs = 3600000;

  if (timeToKickoff > oneHourMs) {
    return 10000; // 10 seconds if >1h away
  } else if (timeToKickoff > 15 * 60 * 1000) {
    return 5000; // 5 seconds if >15m away
  } else {
    return 2000; // 2 seconds if <15m away
  }
}
