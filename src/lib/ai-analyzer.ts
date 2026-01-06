import { Prediction } from '@prisma/client';

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

export async function analyzePrediction(prediction: Prediction): Promise<AnalysisResult> {
  const startTime = Date.now();
  
  // Simulate API calls and processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Extract team names from canonical IDs
  const homeTeam = prediction.canonicalHomeTeamId.replace('custom:', '').replace(/-/g, ' ');
  const awayTeam = prediction.canonicalAwayTeamId.replace('custom:', '').replace(/-/g, ' ');
  const competition = prediction.canonicalCompetitionId.replace('custom:', '').replace(/-/g, ' ');
  
  const mockCitations: Citation[] = [
    {
      sourceUrl: `https://example.com/matches/${homeTeam}-vs-${awayTeam}`,
      sourceProvider: 'ExampleStats',
      sourceTitle: `${homeTeam} vs ${awayTeam} Form Guide`,
      sourceSnippet: `${homeTeam} has won 4 of last 5 home matches in ${competition}`,
      claim: `${homeTeam} has strong home form`,
      excerpt: `Recent statistics show ${homeTeam} performing well at home, winning 80% of their last 5 matches in ${competition}.`,
    },
    {
      sourceUrl: `https://example.com/injuries/${awayTeam}`,
      sourceProvider: 'TeamNews',
      sourceTitle: `${awayTeam} Team News`,
      sourceSnippet: `${awayTeam} key midfielder ruled out for 2 weeks`,
      claim: `${awayTeam} missing important player`,
      excerpt: `${awayTeam} will be without their star midfielder due to injury, which could impact their midfield control.`,
    },
  ];

  const oddsText = prediction.odds ? 
    `The implied probability from odds (${(1/prediction.odds*100).toFixed(1)}%)` : 
    'No odds provided for probability comparison';

  const reasoningText = prediction.reasoning && prediction.reasoning.length > 50 ? 
    prediction.reasoning.substring(0, 50) + '...' : 
    prediction.reasoning || '';

  return {
    summary: `Your ${prediction.market} prediction (${prediction.pick}) for ${homeTeam} vs ${awayTeam} in ${competition} shows ${prediction.reasoning ? 'considered reasoning' : 'potential'}. ${oddsText} ${prediction.odds ? 'aligns moderately' : 'could not be compared'} with statistical trends. Consider recent form and injury news which could impact the match outcome.`,
    
    strengths: [
      `${homeTeam} has strong recent form in ${competition}`,
      'Historical data shows favorable conditions for this type of prediction',
      prediction.reasoning ? 'Your reasoning shows good match analysis' : 'Consider adding more detailed reasoning next time',
    ],
    
    risks: [
      `${awayTeam} has shown resilience in away matches`,
      'Incomplete team news available for analysis',
      'Weather or other external factors not fully considered',
    ],
    
    missingChecks: [
      'Recent lineup changes not fully analyzed',
      'Upcoming schedule congestion for both teams',
      'Referee appointment and style',
    ],
    
    contradictions: prediction.odds ? [
      `Odds of ${prediction.odds.toFixed(2)} suggest market sees this differently`,
      'Market sentiment differs from statistical trends',
    ] : ['No odds provided for market comparison'],
    
    keyFactors: [
      'Midfield battle crucial for match control',
      'Set piece efficiency differences',
      'Manager tactics and historical approach',
    ],
    
    whatWouldChangeMyMind: [
      `Confirmed injury to ${homeTeam} key player`,
      'Significant weather conditions change',
      'Unexpected tactical lineup changes',
    ],
    
    dataQualityNotes: [
      'Analysis based on canonical IDs, not external verified data',
      'Limited recent head-to-head data available',
      'Injury reports may be incomplete',
    ],
    
    confidenceExplanation: 'Moderate confidence (65%) based on available data. The analysis would be stronger with verified external data sources, confirmed lineups, and more recent historical match data.',
    
    confidenceScore: 0.65,
    
    citations: mockCitations,
    
    llmModel: 'mock-analyzer-v1',
    
    processingTimeMs: Date.now() - startTime,
  };
}