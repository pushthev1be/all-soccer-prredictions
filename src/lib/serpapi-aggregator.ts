/**
 * SerpAPI Data Aggregator
 * 
 * Pulls comprehensive data from multiple SerpAPI endpoints to feed into AI predictions:
 * - Sports results (standings, fixtures, live scores)
 * - Twitter results (fan sentiment, breaking news)
 * - Top insights (trending topics, key discussions)
 * - News results (latest articles, injury reports)
 * - Related questions (what people are asking)
 */

import { serpApiSports, SportsResults, GameInfo } from './serpapi-sports';

interface TwitterResult {
  link: string;
  snippet: string;
  date: string;
  author?: string;
}

interface NewsResult {
  link: string;
  title: string;
  snippet: string;
  date: string;
  source: string;
  thumbnail?: string;
}

interface TopInsight {
  title: string;
  snippet: string;
  source: string;
}

interface RelatedQuestion {
  question: string;
  answer?: string;
  link?: string;
}

interface AggregatedMatchData {
  // Core match data
  homeTeam: string;
  awayTeam: string;
  competition: string;
  
  // Sports results
  sportsData: SportsResults | null;
  homeTeamRanking?: string;
  awayTeamRanking?: string;
  recentForm: {
    home: GameInfo[];
    away: GameInfo[];
  };
  
  // Social sentiment
  twitter: {
    results: TwitterResult[];
    sentiment: 'bullish' | 'bearish' | 'neutral';
    keyTopics: string[];
  };
  
  // News & insights
  news: NewsResult[];
  topInsights: TopInsight[];
  
  // Fan questions
  relatedQuestions: RelatedQuestion[];
  
  // Aggregated intelligence
  marketMood: string;
  pressurePoints: string[];
  confidenceSignals: string[];
  riskFactors: string[];
}

class SerpAPIAggregator {
  private config = {
    apiKey: process.env.SERPAPI_API_KEY || '',
    baseUrl: 'https://serpapi.com/search.json',
    // Cache stores search IDs for retrieval
    searchCache: new Map<string, { id: string; timestamp: number }>(),
    // Rate limiting
    lastRequestTime: 0,
    minRequestInterval: 100, // 100ms between requests
  };

  isConfigured(): boolean {
    return Boolean(this.config.apiKey);
  }

  private async makeRequest(params: Record<string, string>, useCache = true): Promise<any> {
    if (!this.isConfigured()) {
      console.warn('⚠️ SerpAPI not configured - skipping request');
      return null;
    }

    // Rate limiting: wait if needed
    const now = Date.now();
    const timeSinceLastRequest = now - this.config.lastRequestTime;
    if (timeSinceLastRequest < this.config.minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.config.minRequestInterval - timeSinceLastRequest));
    }
    this.config.lastRequestTime = Date.now();

    const queryParams = new URLSearchParams({
      ...params,
      api_key: this.config.apiKey,
      engine: 'google',
      // Use cache by default (FREE after 1h, not counted toward quota)
      no_cache: useCache ? 'false' : 'true',
      // Restrict JSON for smaller/faster responses
      json_restrictor: 'title,snippet,link,date,source,thumbnail',
      // Set location for consistent results
      location: 'United States',
      hl: 'en',
      gl: 'us',
    });

    const url = `${this.config.baseUrl}?${queryParams.toString()}`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`SerpAPI error [${response.status}]: ${errorText}`);
        
        // Handle specific error codes
        if (response.status === 429) {
          console.error('⚠️ Rate limit exceeded - slow down requests');
        } else if (response.status === 401) {
          console.error('⚠️ Invalid API key');
        }
        
        throw new Error(`SerpAPI error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Log API usage info
      if (data.search_metadata) {
        console.log(`📊 SerpAPI: ${data.search_metadata.total_time_taken || 0}s, ID: ${data.search_metadata.id || 'N/A'}`);
        
        // Store search ID for potential retrieval
        if (data.search_metadata.id) {
          const cacheKey = JSON.stringify(params);
          this.config.searchCache.set(cacheKey, {
            id: data.search_metadata.id,
            timestamp: Date.now()
          });
        }
      }
      
      return data;
    } catch (error) {
      console.error('SerpAPI request failed:', error);
      return null;
    }
  }

  /**
   * Get Twitter sentiment and discussions about the match
   * Uses Google search to find Twitter posts (more reliable than Twitter API)
   */
  async getTwitterSentiment(homeTeam: string, awayTeam: string): Promise<{
    results: TwitterResult[];
    sentiment: 'bullish' | 'bearish' | 'neutral';
    keyTopics: string[];
  }> {
    const query = `${homeTeam} vs ${awayTeam} (site:twitter.com OR site:x.com)`;
    
    const data = await this.makeRequest({
      q: query,
      num: '10', // Limit results for efficiency
      tbs: 'qdr:w', // Past week only for recency
    });

    if (!data || !data.organic_results) {
      return { results: [], sentiment: 'neutral', keyTopics: [] };
    }

    const results: TwitterResult[] = data.organic_results
      .filter((r: any) => r.link?.includes('twitter.com') || r.link?.includes('x.com'))
      .slice(0, 10)
      .map((r: any) => ({
        link: r.link,
        snippet: r.snippet || '',
        date: r.date || 'recent',
        author: r.source,
      }));

    // Analyze sentiment from snippets
    const snippets = results.map(r => r.snippet.toLowerCase()).join(' ');
    const bullishWords = ['win', 'confident', 'strong', 'dominate', 'favorite', 'back', 'bet'];
    const bearishWords = ['lose', 'weak', 'struggle', 'doubt', 'risky', 'avoid', 'against'];
    
    const bullishCount = bullishWords.reduce((sum, word) => sum + (snippets.split(word).length - 1), 0);
    const bearishCount = bearishWords.reduce((sum, word) => sum + (snippets.split(word).length - 1), 0);
    
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (bullishCount > bearishCount * 1.5) sentiment = 'bullish';
    else if (bearishCount > bullishCount * 1.5) sentiment = 'bearish';

    // Extract key topics (simple word frequency)
    const words = snippets.split(/\s+/).filter(w => w.length > 4);
    const frequency: Record<string, number> = {};
    words.forEach(w => frequency[w] = (frequency[w] || 0) + 1);
    const keyTopics = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    return { results, sentiment, keyTopics };
  }

  /**
   * Get news articles about the teams
   * Uses Google News for fresh sports journalism
   */
  async getNewsResults(homeTeam: string, awayTeam: string): Promise<NewsResult[]> {
    const query = `"${homeTeam}" "${awayTeam}"`;
    
    const data = await this.makeRequest({
      q: query,
      tbm: 'nws', // Google News engine
      num: '10',
      tbs: 'qdr:d', // Past day for breaking news
    });

    if (!data || !data.news_results) {
      return [];
    }

    return data.news_results.slice(0, 10).map((article: any) => ({
      link: article.link,
      title: article.title,
      snippet: article.snippet || '',
      date: article.date || '',
      source: article.source || 'Unknown',
      thumbnail: article.thumbnail,
    }));
  }

  /**
   * Get top insights and trending discussions
   * Searches for expert analysis and predictions
   */
  async getTopInsights(homeTeam: string, awayTeam: string): Promise<TopInsight[]> {
    const query = `"${homeTeam} vs ${awayTeam}" (prediction OR preview OR analysis)`;
    
    const data = await this.makeRequest({
      q: query,
      num: '5', // Top 5 quality insights better than 10 mediocre
      tbs: 'qdr:w', // Past week
    });

    if (!data || !data.organic_results) {
      return [];
    }

    const insights: TopInsight[] = [];

    // Extract from answer box if available
    if (data.answer_box) {
      insights.push({
        title: data.answer_box.title || 'Google Answer',
        snippet: data.answer_box.answer || data.answer_box.snippet || '',
        source: 'Google Answer Box',
      });
    }

    // Extract from top results
    data.organic_results.slice(0, 5).forEach((result: any) => {
      if (result.snippet) {
        insights.push({
          title: result.title,
          snippet: result.snippet,
          source: result.displayed_link || result.link,
        });
      }
    });

    return insights;
  }

  /**
   * Get related questions people are asking
   */
  async getRelatedQuestions(homeTeam: string, awayTeam: string): Promise<RelatedQuestion[]> {
    const query = `${homeTeam} vs ${awayTeam}`;
    
    const data = await this.makeRequest({
      q: query,
      num: '10',
    });

    if (!data || !data.related_questions) {
      return [];
    }

    return data.related_questions.slice(0, 8).map((q: any) => ({
      question: q.question,
      answer: q.snippet || q.answer,
      link: q.link,
    }));
  }

  /**
   * MASTER AGGREGATOR: Pull all data for a match
   * Optimized with parallel requests and graceful degradation
   */
  async aggregateMatchData(homeTeam: string, awayTeam: string, competition?: string): Promise<AggregatedMatchData> {
    console.log(`🔥 SerpAPI AGGREGATOR: Pulling comprehensive data for ${homeTeam} vs ${awayTeam}`);

    if (!this.isConfigured()) {
      console.warn('⚠️ SerpAPI not configured - returning empty aggregated data');
      return this.getEmptyData(homeTeam, awayTeam, competition || 'Unknown');
    }

    const startTime = Date.now();

    // Parallel fetch all data sources with error handling
    // Each promise catches its own errors to prevent one failure from breaking all
    const [
      homeTeamData,
      awayTeamData,
      twitterData,
      newsData,
      insightsData,
      questionsData,
    ] = await Promise.all([
      serpApiSports.getTeamResults(homeTeam).catch(e => { console.error('Team data failed:', e); return null; }),
      serpApiSports.getTeamResults(awayTeam).catch(e => { console.error('Team data failed:', e); return null; }),
      this.getTwitterSentiment(homeTeam, awayTeam).catch(e => { console.error('Twitter failed:', e); return { results: [], sentiment: 'neutral' as const, keyTopics: [] }; }),
      this.getNewsResults(homeTeam, awayTeam).catch(e => { console.error('News failed:', e); return []; }),
      this.getTopInsights(homeTeam, awayTeam).catch(e => { console.error('Insights failed:', e); return []; }),
      this.getRelatedQuestions(homeTeam, awayTeam).catch(e => { console.error('Questions failed:', e); return []; }),
    ]);

    const processingTime = Date.now() - startTime;
    console.log(`✅ SerpAPI data aggregated in ${processingTime}ms`);

    // Extract recent form
    const homeRecent = await serpApiSports.getRecentResults(homeTeam);
    const awayRecent = await serpApiSports.getRecentResults(awayTeam);

    // Analyze aggregated intelligence
    const marketMood = this.analyzeMarketMood(twitterData.sentiment, newsData, insightsData);
    const pressurePoints = this.extractPressurePoints(newsData, insightsData, questionsData);
    const confidenceSignals = this.extractConfidenceSignals(homeRecent, awayRecent, twitterData);
    const riskFactors = this.extractRiskFactors(newsData, questionsData, homeRecent, awayRecent);

    return {
      homeTeam,
      awayTeam,
      competition: competition || homeTeamData?.title || 'Unknown',
      
      sportsData: homeTeamData,
      homeTeamRanking: homeTeamData?.rankings,
      awayTeamRanking: awayTeamData?.rankings,
      
      recentForm: {
        home: homeRecent,
        away: awayRecent,
      },
      
      twitter: twitterData,
      news: newsData,
      topInsights: insightsData,
      relatedQuestions: questionsData,
      
      marketMood,
      pressurePoints,
      confidenceSignals,
      riskFactors,
    };
  }

  private analyzeMarketMood(
    twitterSentiment: 'bullish' | 'bearish' | 'neutral',
    news: NewsResult[],
    insights: TopInsight[]
  ): string {
    const newsHeadlines = news.map(n => n.title.toLowerCase()).join(' ');
    
    if (twitterSentiment === 'bullish' && newsHeadlines.includes('favorite')) {
      return '🔥 STRONG BULLISH - Market backing this heavy';
    } else if (twitterSentiment === 'bearish') {
      return '⚠️ BEARISH - Doubt in the air, fade the public?';
    } else if (news.length < 3) {
      return '😴 QUIET - Low market interest, value opportunity?';
    } else {
      return '⚖️ NEUTRAL - Split opinions, dig deeper';
    }
  }

  private extractPressurePoints(
    news: NewsResult[],
    insights: TopInsight[],
    questions: RelatedQuestion[]
  ): string[] {
    const points: string[] = [];
    
    const allText = [
      ...news.map(n => n.snippet),
      ...insights.map(i => i.snippet),
      ...questions.map(q => q.answer || ''),
    ].join(' ').toLowerCase();

    if (allText.includes('injury') || allText.includes('injured')) {
      points.push('🩹 Injury concerns - check lineups before kickoff');
    }
    if (allText.includes('suspend') || allText.includes('banned')) {
      points.push('🚫 Suspension issues - key player missing');
    }
    if (allText.includes('form') || allText.includes('struggle')) {
      points.push('📉 Form worries - recent performances shaky');
    }
    if (allText.includes('pressure') || allText.includes('must win')) {
      points.push('💥 High pressure situation - desperation factor');
    }

    return points.length > 0 ? points : ['✅ No major pressure points identified'];
  }

  private extractConfidenceSignals(
    homeForm: GameInfo[],
    awayForm: GameInfo[],
    twitter: { sentiment: string; keyTopics: string[] }
  ): string[] {
    const signals: string[] = [];
    
    // Form-based signals
    const homeWins = homeForm.filter(g => 
      g.teams.find(t => t.score && parseInt(t.score) > 0)
    ).length;
    
    if (homeWins >= 3) {
      signals.push('🔥 Home team on fire - ' + homeWins + ' wins in recent games');
    }
    
    // Sentiment signals
    if (twitter.sentiment === 'bullish') {
      signals.push('📱 Social media buzz - public confidence high');
    }

    // Topic signals
    if (twitter.keyTopics.some(t => ['win', 'dominate', 'strong'].some(w => t.includes(w)))) {
      signals.push('💪 Dominant narrative - market expects control');
    }

    return signals.length > 0 ? signals : ['⚠️ Mixed signals - proceed with caution'];
  }

  private extractRiskFactors(
    news: NewsResult[],
    questions: RelatedQuestion[],
    homeForm: GameInfo[],
    awayForm: GameInfo[]
  ): string[] {
    const risks: string[] = [];
    
    const headlines = news.map(n => n.title.toLowerCase()).join(' ');
    
    if (headlines.includes('upset') || headlines.includes('underdog')) {
      risks.push('🎲 Upset potential - underdogs can bite');
    }
    
    if (questions.some(q => q.question.toLowerCase().includes('injury'))) {
      risks.push('🏥 Injury uncertainty - lineup unknown');
    }
    
    if (homeForm.length < 2 || awayForm.length < 2) {
      risks.push('❓ Limited data - not enough recent form');
    }

    return risks.length > 0 ? risks : ['✅ No major risks identified'];
  }

  private getEmptyData(homeTeam: string, awayTeam: string, competition: string): AggregatedMatchData {
    return {
      homeTeam,
      awayTeam,
      competition,
      sportsData: null,
      recentForm: { home: [], away: [] },
      twitter: { results: [], sentiment: 'neutral', keyTopics: [] },
      news: [],
      topInsights: [],
      relatedQuestions: [],
      marketMood: '⚠️ No data available',
      pressurePoints: ['SerpAPI not configured'],
      confidenceSignals: ['SerpAPI not configured'],
      riskFactors: ['Cannot assess risk without data'],
    };
  }
}

export const serpApiAggregator = new SerpAPIAggregator();
export type { AggregatedMatchData, TwitterResult, NewsResult, TopInsight, RelatedQuestion };
