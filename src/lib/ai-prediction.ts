import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

// Models to try in order (free first, then paid fallback)
const MODELS = [
  'mistralai/mistral-7b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'google/gemma-2-9b-it:free',
];

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

// Helper to delay between retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Make a single API call to OpenRouter
async function callOpenRouter(model: string, prompt: string): Promise<AIPredictor | null> {
  const response = await axios.post(
    `${OPENROUTER_BASE_URL}/chat/completions`,
    {
      model,
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
        'HTTP-Referer': 'https://allsoccer.app',
        'X-Title': 'All Soccer Predictions',
      },
      timeout: 30000,
      validateStatus: () => true, // Don't throw on non-2xx
    }
  );

  // Log full response for debugging
  console.log(`📡 OpenRouter response (${model}):`, {
    status: response.status,
    error: response.data?.error,
    choices: response.data?.choices?.length,
    finishReason: response.data?.choices?.[0]?.finish_reason,
    model: response.data?.model,
    provider: response.data?.provider,
  });

  // Check for API-level errors
  if (response.status !== 200) {
    console.error(`❌ OpenRouter API error (${response.status}):`, response.data?.error || response.data);
    return null;
  }

  // Check for error in response body (can happen with 200 status)
  if (response.data?.error) {
    console.error(`❌ OpenRouter error in response:`, response.data.error);
    return null;
  }

  const content = response.data?.choices?.[0]?.message?.content;
  const finishReason = response.data?.choices?.[0]?.finish_reason;

  // Check for error finish reason
  if (finishReason === 'error') {
    console.error(`❌ OpenRouter finish_reason is error`);
    return null;
  }

  if (!content) {
    console.error(`⚠️ No content in AI response (finish_reason: ${finishReason})`);
    return null;
  }

  console.log(`✅ Got AI response content (${content.length} chars)`);

  // Parse JSON from response (handle potential markdown wrapping)
  // Clean markdown code blocks first
  let cleanedContent = content
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();

  const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('No JSON found in AI response:', content.substring(0, 200));
    return null;
  }

  // Try to parse JSON, fixing common issues
  let jsonStr = jsonMatch[0];
  try {
    // Fix trailing commas
    jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    const prediction = JSON.parse(jsonStr) as AIPredictor;

    // Validate response structure
    if (!prediction.prediction || typeof prediction.confidence !== 'number') {
      console.error('Invalid prediction structure:', prediction);
      return null;
    }

    return prediction;
  } catch (parseError) {
    console.error('JSON parse error:', parseError, 'Raw:', jsonStr.substring(0, 200));
    return null;
  }
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

  // Try each model with retries
  for (const model of MODELS) {
    console.log(`🤖 Trying model: ${model}`);
    
    // Retry up to 3 times per model
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await callOpenRouter(model, prompt);
        if (result) {
          console.log(`✅ AI prediction successful with ${model} (attempt ${attempt})`);
          return result;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < 3) {
          const waitTime = attempt * 2000;
          console.log(`⏳ Retrying in ${waitTime}ms...`);
          await delay(waitTime);
        }
      } catch (error) {
        console.error(`❌ Error with ${model} (attempt ${attempt}):`, error);
        if (attempt < 3) {
          await delay(attempt * 2000);
        }
      }
    }
    
    console.log(`⚠️ Model ${model} failed after 3 attempts, trying next model...`);
  }

  console.error('❌ All models failed to generate prediction');
  return null;
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
        model: 'mistralai/mistral-7b-instruct:free',
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
