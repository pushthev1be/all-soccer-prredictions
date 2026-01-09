# Core Engine Implementation Guide

## Overview
This guide explains the real AI analysis engine implementation for soccer prediction analysis.

## Architecture

### 1. Sports Data Provider (`src/lib/sports-data-provider.ts`)
Fetches comprehensive match data including:
- Team form (last 10 matches: W/D/L, goals, clean sheets)
- Head-to-head statistics
- Injury reports
- Live betting odds from multiple bookmakers
- Weather and referee information

**Mock Mode (Default):**
- Returns realistic simulated data
- No API keys required
- Perfect for development and testing

**Real Mode:**
- Set `ENABLE_REAL_SPORTS_DATA=true`
- Requires `SPORTS_API_KEY` (API-Football via RapidAPI)
- Fetches live data from external APIs

### 2. AI Analyzer (`src/lib/ai-analyzer.ts`)
Performs deep analysis of predictions using:

**Mock Mode (Default):**
- Enhanced data-driven analysis using sports data
- Calculates win rates, form trends, H2H patterns
- Generates realistic feedback without AI API costs
- Processing time: ~1.5 seconds

**AI Mode:**
- Set `ENABLE_AI_ANALYSIS=true`
- Requires `OPENAI_API_KEY`
- Uses GPT-4 Turbo for expert analysis
- Structured prompts with all match context
- Returns JSON-formatted insights

### 3. Analysis Output Structure
```typescript
{
  summary: string;                    // Executive summary
  strengths: string[];                 // Prediction strengths
  risks: string[];                     // Key risks identified
  missingChecks: string[];             // What wasn't analyzed
  contradictions: string[];            // Market vs stats conflicts
  keyFactors: string[];                // Crucial match factors
  whatWouldChangeMyMind: string[];     // Invalidating conditions
  dataQualityNotes: string[];          // Data limitations
  confidenceExplanation: string;       // Confidence reasoning
  confidenceScore: number;             // 0.0-1.0
  citations: Citation[];               // Data sources
  llmModel: string;                    // Analysis model used
  processingTimeMs: number;            // Processing duration
}
```

## Configuration

### Environment Variables

**Required (Already Set):**
- `DATABASE_URL` - PostgreSQL connection
- `NEXTAUTH_SECRET` - Authentication secret
- `REDIS_URL` - Queue system (Upstash)

**AI Engine (Optional):**
```env
# For OpenAI Analysis
OPENAI_API_KEY="sk-your-key-here"
ENABLE_AI_ANALYSIS="true"

# For Real Sports Data
SPORTS_API_KEY="your-rapidapi-key"
ENABLE_REAL_SPORTS_DATA="true"
```

### Operating Modes

**Mode 1: Mock Everything (Current - Free)**
```env
ENABLE_AI_ANALYSIS="false"
ENABLE_REAL_SPORTS_DATA="false"
```
- No API costs
- Realistic simulated data
- Perfect for development
- Enhanced mock analyzer with form calculations

**Mode 2: Real Data + Mock AI (Cost-Effective)**
```env
ENABLE_AI_ANALYSIS="false"
ENABLE_REAL_SPORTS_DATA="true"
SPORTS_API_KEY="your-key"
```
- Real match data
- No LLM costs
- Data-driven mock analysis
- Good for testing data integration

**Mode 3: Mock Data + Real AI (Test AI)**
```env
ENABLE_AI_ANALYSIS="true"
OPENAI_API_KEY="your-key"
ENABLE_REAL_SPORTS_DATA="false"
```
- OpenAI analysis
- Simulated data
- Test AI prompts
- ~$0.01-0.02 per analysis

**Mode 4: Full Production (Most Expensive)**
```env
ENABLE_AI_ANALYSIS="true"
OPENAI_API_KEY="your-key"
ENABLE_REAL_SPORTS_DATA="true"
SPORTS_API_KEY="your-key"
```
- Real data + AI analysis
- Full feature set
- ~$0.01-0.03 per prediction

## API Keys & Costs

### OpenAI (GPT-4 Turbo)
- **Get Key:** https://platform.openai.com/api-keys
- **Cost:** ~$0.01-0.02 per prediction analysis
- **Model:** gpt-4-turbo-preview
- **Input:** ~1500 tokens | **Output:** ~500 tokens

### API-Football (RapidAPI)
- **Get Key:** https://rapidapi.com/api-sports/api/api-football
- **Free Tier:** 100 requests/day
- **Pro:** $9.99/month - 3000 requests/day
- **Features:** Live fixtures, odds, team stats, injuries

## Data Flow

1. **User creates prediction** → Queue job
2. **Worker picks up job** → Calls `analyzePrediction()`
3. **Fetch sports data** → Sports Data Provider
   - Real API call OR mock data
4. **AI Analysis** → OpenAI API
   - Structured prompt with all context
   - JSON response parsing
5. **Generate citations** → Link to data sources
6. **Save to DB** → Feedback + Citations + Sources
7. **UI auto-refreshes** → Display analysis

## Prompt Engineering

The AI receives comprehensive match context:
- Competition, teams, venue, referee
- Home/away form (10 matches)
- Head-to-head history
- Injury reports
- Market odds & implied probabilities
- User's reasoning
- Weather conditions

Response format enforced via JSON mode for consistency.

## Testing

### Test Mock Mode
```bash
# No keys needed
npm run dev
# Create prediction → check feedback
```

### Test AI Mode
```bash
# Set in .env
ENABLE_AI_ANALYSIS="true"
OPENAI_API_KEY="sk-..."

npm run dev
npm run worker
# Create prediction → AI analysis runs
```

### Verify Analysis Quality
- Check confidence scores (should be 0.5-0.9)
- Review strengths/risks for specificity
- Ensure citations link to data
- Validate contradictions identify odds conflicts

## Monitoring

**Worker Logs:**
```bash
# Terminal running worker
🗑️ Processing analysis job...
✅ Fixture data fetched
🤖 AI analysis complete (model: gpt-4-turbo-preview)
✅ Saved to database
```

**Cost Tracking:**
- OpenAI Dashboard: https://platform.openai.com/usage
- RapidAPI Dashboard: https://rapidapi.com/developer/billing

## Future Enhancements

**Phase 1 (Current):**
- ✅ Mock data provider with realistic stats
- ✅ OpenAI integration with structured prompts
- ✅ Citation generation
- ✅ Confidence scoring

**Phase 2 (Next):**
- Real API-Football integration
- Multiple bookmaker odds comparison
- xG (expected goals) analysis
- Lineup confirmation checking

**Phase 3 (Advanced):**
- Historical model training
- Bet tracking & ROI analysis
- Custom ML models
- Real-time odds movement alerts

## Security Notes

- **Never commit `.env`** - it's in `.gitignore`
- Use `.env.example` as template
- Rotate API keys regularly
- Monitor usage to prevent cost overruns
- Set OpenAI usage limits in dashboard

## Support

**Issues:**
- OpenAI errors → Check API key & usage limits
- Data provider errors → Verify SPORTS_API_KEY
- Mock mode not working → Check ENABLE flags are "false"

**Resources:**
- OpenAI Docs: https://platform.openai.com/docs
- API-Football: https://www.api-football.com/documentation-v3
- BullMQ: https://docs.bullmq.io/
