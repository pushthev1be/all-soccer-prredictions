import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

export interface PredictionRequest {
  homeTeam: string;
  awayTeam: string;
  competition: string;
  odds?: {
    homeWin?: number;
    draw?: number;
    awayWin?: number;
  };
  historicalContext?: string;
  userReasoning?: string;
}

export interface AIPredictor {
  prediction: 'Home Win' | 'Draw' | 'Away Win';
  confidence: number;
  reasoning: string;
  recommendedBet: string;
  keyFactors: string[];
  risks: string[];
}

export async function generateAIPrediction(fixture: PredictionRequest): Promise<AIPredictor | null> {
  if (!OPENROUTER_API_KEY) {
    console.warn('OPENROUTER_API_KEY not set, AI predictions disabled');
    return null;
  }

  const prompt = `You are an expert football/soccer betting analyst. Analyze this match and provide a detailed prediction.

**Match Details:**
- Home Team: ${fixture.homeTeam}
- Away Team: ${fixture.awayTeam}
- Competition: ${fixture.competition}
${fixture.odds ? `- Odds: Home ${fixture.odds.homeWin} | Draw ${fixture.odds.draw} | Away ${fixture.odds.awayWin}` : ''}
${fixture.historicalContext ? `- Context: ${fixture.historicalContext}` : ''}
${fixture.userReasoning ? `- User's Initial Reasoning: ${fixture.userReasoning}` : ''}

**Your Task:**
Provide a structured prediction in valid JSON format (no markdown, no code blocks, just pure JSON):

{
  "prediction": "Home Win" or "Draw" or "Away Win",
  "confidence": 0.0-1.0 (decimal number),
  "reasoning": "2-3 sentence explanation",
  "recommendedBet": "specific betting recommendation",
  "keyFactors": ["factor1", "factor2", "factor3"],
  "risks": ["risk1", "risk2"]
}

Be data-driven and specific. Consider form, head-to-head, odds implications, and tactical factors.`;

  try {
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: 'meta-llama/llama-3.1-70b-instruct:free',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const content = response.data.choices[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response');
      return null;
    }

    // Parse JSON from response (handle potential markdown wrapping)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in AI response:', content);
      return null;
    }

    const prediction = JSON.parse(jsonMatch[0]) as AIPredictor;

    // Validate response structure
    if (!prediction.prediction || typeof prediction.confidence !== 'number') {
      console.error('Invalid prediction structure:', prediction);
      return null;
    }

    return prediction;
  } catch (error) {
    console.error('Error generating AI prediction:', error);
    if (axios.isAxiosError(error)) {
      console.error('OpenRouter error:', error.response?.data);
    }
    return null;
  }
}

export async function generateQuickAnalysis(fixture: PredictionRequest): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    return `${fixture.homeTeam} vs ${fixture.awayTeam} in ${fixture.competition}. Awaiting detailed analysis...`;
  }

  const prompt = `Give a 1-sentence quick prediction for: ${fixture.homeTeam} vs ${fixture.awayTeam} (${fixture.competition})`;

  try {
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: 'meta-llama/llama-3.1-70b-instruct:free',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 100,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    return response.data.choices[0]?.message?.content || 'Analysis pending...';
  } catch (error) {
    console.error('Error generating quick analysis:', error);
    return 'Unable to generate analysis at this time.';
  }
}
