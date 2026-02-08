import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

// Models to try in order (using reliable affordable models)
const MODELS = [
  'meta-llama/llama-3.1-8b-instruct',  // Fast and cheap ($0.05/1M tokens)
  'google/gemini-flash-1.5',           // Very fast and affordable
  'anthropic/claude-3-haiku',          // High quality fallback
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
  serpApiContext?: string; // NEW: SerpAPI enriched data
  gamblingMode?: boolean;   // NEW: Enable aggressive betting tone
}

export interface AIPredictor {
  prediction: 'Home Win' | 'Draw' | 'Away Win';
  confidence: number;
  reasoning: string;
  recommendedBet: string;
  keyFactors: string[];
  risks: string[];
  scorelinePrediction?: string;
  likelyScorers?: {
    home: string[];
    away: string[];
  };
  alternativeBets?: Array<{
    bet: string;
    rationale: string;
  }>;
  alternativeViews?: {
    bullish: string;
    bearish: string;
    neutral: string;
    contrarian: string;
  };
  confidenceRange?: {
    low: number;
    high: number;
  };
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
      max_tokens: 1200, // Increased from 500 to accommodate full JSON response without truncation
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
    // Handle truncated JSON - try to repair incomplete objects
    console.warn('JSON parse failed, attempting repair:', (parseError as Error).message);
    
    // Try to find the last valid closing brace
    const lastBrace = jsonStr.lastIndexOf('}');
    const lastBracket = jsonStr.lastIndexOf(']');
    const lastValidPos = Math.max(lastBrace, lastBracket);
    
    if (lastValidPos > 10) {
      const repairedStr = jsonStr.substring(0, lastValidPos + 1);
      try {
        console.log('🔧 Attempting repair from truncated response...');
        const prediction = JSON.parse(repairedStr) as AIPredictor;
        
        if (prediction.prediction && typeof prediction.confidence === 'number') {
          console.log('✅ Successfully repaired truncated response');
          return prediction;
        }
      } catch (repairError) {
        console.error('Repair failed:', repairError);
      }
    }
    
    console.error('JSON parse error (unrecoverable):', parseError, 'Raw:', jsonStr.substring(0, 300));
    return null;
  }
}

export async function generateAIPrediction(fixture: PredictionRequest): Promise<AIPredictor | null> {
  if (!OPENROUTER_API_KEY) {
    console.warn('OPENROUTER_API_KEY not set, AI predictions disabled');
    return null;
  }

  const gamblingTone = fixture.gamblingMode ? `
**GAMBLING MODE ACTIVATED** 🎲
You are a sharp sports bettor, not a conservative analyst. Your job is to find edges and make aggressive calls.
- Speak with confidence, not hedging language
- Focus on VALUE and where bookies are vulnerable  
- Use betting slang ("hammer this", "fade the public", "trap game", "sharp money")
- Give specific bet recommendations with conviction
- Acknowledge risks but don't be timid
` : '';

  const prompt = `You are an elite football/soccer betting analyst with years of sharp betting experience. ${gamblingTone}

**Match Details:**
- Home Team: ${fixture.homeTeam}
- Away Team: ${fixture.awayTeam}
- Competition: ${fixture.competition}
${fixture.odds ? `- Odds: Home ${fixture.odds.homeWin} | Draw ${fixture.odds.draw} | Away ${fixture.odds.awayWin}` : ''}
${fixture.historicalContext ? `- H2H: ${fixture.historicalContext}` : ''}
${fixture.userReasoning ? `- User's Angle: ${fixture.userReasoning}` : ''}
${fixture.serpApiContext ? `\n${fixture.serpApiContext}\n` : ''}

**Your Task:**
Provide a structured prediction in valid JSON format (no markdown, no code blocks, just pure JSON):

{
  "prediction": "Home Win" or "Draw" or "Away Win",
  "confidence": 0.0-1.0 (decimal number),
  "reasoning": "2-3 sentence explanation with specific stats and reasoning",
  "recommendedBet": "specific betting recommendation with bet size guidance",
  "keyFactors": ["Statistical fact with number", "Tactical advantage explained", "Context-specific factor"],
  "risks": ["Risk with specific consequence", "Counter-argument with evidence", "Wildcard factor"],
  "scorelinePrediction": "e.g., 2-1 (expected result based on xG)",
  "likelyScorers": {
    "home": ["Player A (reason)", "Player B (reason)"],
    "away": ["Player C (reason)"]
  },
  "alternativeBets": [
    { "bet": "Over 2.5 Goals", "rationale": "Because total xG = X + Y which favors over" },
    { "bet": "Home -0.5", "rationale": "When home team's expected advantage is +0.8 goals" }
  ],
  "alternativeViews": {
    "bullish": "All factors align: form + odds + tactical setup = conviction play",
    "bearish": "Market might be undervaluing [specific risk]; consider the fade",
    "neutral": "Too much uncertainty; edges unclear; recommend skip or minimal sizing",
    "contrarian": "Public perception vs. reality: the consensus undervalues [aspect]"
  },
  "confidenceRange": { "low": 0.60, "high": 0.72 }
}

**ANALYSIS DEPTH REQUIREMENTS:**
1. **Statistical Anchors**: 
   - Reference specific metrics: xG, possession%, shots on target, recent form (W-D-L record)
   - Use odds to imply market probability and compare to your model
   - Include head-to-head context with actual results, not just "has winning record"

2. **Tactical Nuances**: 
   - Identify specific matchups (press vs counter-attack, set pieces, wing dominance)
   - Flag formations and how they clash (e.g., "3-5-2 high-press home vs 4-2-3-1 counter")
   - Assess vulnerable points (e.g., "Away team's fullbacks struggle vs pace")

3. **Context Awareness**: 
   - Home advantage impact (typically 0.3-0.5 xG boost)
   - Match importance (derby, relegation battle, title decider)
   - Schedule fatigue (mid-week fixture before big weekend game)
   - Injuries to key players and tactical implications

4. **Market Context**: 
   - If odds = 2.0 (50% implied), but your model = 55%, that's +5% value
   - Explain whether market has missed something or if you're overconfident
   - Reference public betting patterns if known (sharp vs public divergence)

5. **Alternative Bets**: 
   - Offer 1–2 hedges (e.g., if backing home win, suggest small each-way to draw)
   - Specify total goals, corners, cards based on tactical tendencies

**CRITICAL THINKING:**
- Weakest link: What's the biggest flaw in this analysis?
- Change of mind trigger: What specific event/stat would make you flip (e.g., "If Team A goes up 2-0 before minute 30, reassess away team value")
- Hidden swings: Weather, referee tendencies, late squad changes, public sentiment driving odds

**Scoring Guidance:**
- 0.70+: "Large" conviction, back with confidence
- 0.55-0.70: "Medium" sizing, solid edge but not a lock
- 0.50-0.55: "Small" sizing, minimal edge
- <0.50: "Avoid" or fade the market consensus

Be obsessively data-driven. Cite numbers. Explain logic. Make specific calls, not hedged statements.`;

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
