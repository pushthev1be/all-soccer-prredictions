import 'dotenv/config';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { analyzePrediction } from '@/lib/ai-analyzer';
import { normalizeTeamName, getTeamId } from '@/lib/team-normalizer';

// Log env var status for debugging
console.log('🔑 OPENROUTER_API_KEY configured:', !!process.env.OPENROUTER_API_KEY);
console.log('🔑 REDIS_URL configured:', !!process.env.REDIS_URL);

const prisma = new PrismaClient();

// Redis connection with Upstash support
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
console.log('Connecting to Redis at:', redisUrl.replace(/:\/\/.*@/, '://***@'));

const redisConfig: any = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  connectTimeout: 10000,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 100, 3000);
    console.log(`Redis retry attempt ${times}, delaying ${delay}ms`);
    return delay;
  },
};

// Add TLS for Upstash (rediss:// protocol)
if (redisUrl.startsWith('rediss://')) {
  redisConfig.tls = {};
}

const connection = new IORedis(redisUrl, redisConfig);

connection.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

connection.on('connect', () => {
  console.log('✅ Worker connected to Redis');
});

connection.on('ready', () => {
  console.log('✅ Worker Redis ready for commands');
});

// Create worker
const worker = new Worker(
  'predictions',
  async (job) => {
    console.log(`🎯 Worker processing job ${job.id}...`);
    const { predictionId } = job.data;
    
    if (!predictionId) {
      throw new Error('No predictionId provided in job data');
    }
    
    console.log(`Processing prediction ${predictionId}...`);
    
    try {
      // Update status to processing
      await prisma.prediction.update({
        where: { id: predictionId },
        data: { status: 'processing' },
      });

      // Get prediction with user data
      const prediction = await prisma.prediction.findUnique({
        where: { id: predictionId },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });

      if (!prediction) {
        throw new Error(`Prediction ${predictionId} not found`);
      }

      // Extract team names from canonical IDs for logging
      const rawHomeTeam = prediction.canonicalHomeTeamId.replace('custom:', '').replace(/-/g, ' ');
      const rawAwayTeam = prediction.canonicalAwayTeamId.replace('custom:', '').replace(/-/g, ' ');
      const competitionName = prediction.canonicalCompetitionId.replace('custom:', '').replace(/-/g, ' ');

      const homeTeamName = normalizeTeamName(rawHomeTeam);
      const awayTeamName = normalizeTeamName(rawAwayTeam);

      const homeTeamId = getTeamId(homeTeamName);
      const awayTeamId = getTeamId(awayTeamName);

      console.log(`📊 Prediction found: ${homeTeamName} vs ${awayTeamName} in ${competitionName}`);
      if (!homeTeamId || !awayTeamId) {
        console.log(`⚠️  Missing team IDs — homeId:${homeTeamId} awayId:${awayTeamId} (raw: ${rawHomeTeam} vs ${rawAwayTeam})`);
      }
      console.log(`   Market: ${prediction.market}, Pick: ${prediction.pick}`);
      console.log(`   Kickoff: ${prediction.kickoffTimeUTC.toISOString()}`);
      
      // Run AI analysis
      const analysis = await analyzePrediction(prediction);

      // Store feedback in database
      const feedback = await prisma.feedback.create({
        data: {
          predictionId: prediction.id,
          summary: analysis.summary,
          strengths: analysis.strengths,
          risks: analysis.risks,
          missingChecks: analysis.missingChecks,
          contradictions: analysis.contradictions,
          keyFactors: analysis.keyFactors,
          whatWouldChangeMyMind: analysis.whatWouldChangeMyMind,
          dataQualityNotes: analysis.dataQualityNotes,
          confidenceExplanation: analysis.confidenceExplanation,
          confidenceScore: analysis.confidenceScore,
          ...(analysis.recommendedBet && { recommendedBet: analysis.recommendedBet }),
          ...(analysis.qualityTier && { qualityTier: analysis.qualityTier }),
          ...(analysis.dataCompleteness !== undefined && { dataCompleteness: analysis.dataCompleteness }),
          ...(analysis.actionableInsights && { actionableInsights: analysis.actionableInsights }),
          ...(analysis.confidenceIntervals && { confidenceIntervals: analysis.confidenceIntervals }),
          ...(analysis.alternativeBets && { alternativeBets: analysis.alternativeBets }),
          ...(analysis.alternativeViews && { alternativeViews: analysis.alternativeViews }),
          ...(analysis.numbersSummary && { numbersSummary: analysis.numbersSummary }),
          ...(analysis.historicalComparisons && { historicalComparisons: analysis.historicalComparisons }),
          ...(analysis.validationIssues && { validationIssues: analysis.validationIssues }),
          ...(analysis.validationSuggestions && { validationSuggestions: analysis.validationSuggestions }),
          ...(analysis.scorelinePrediction && { scorelinePrediction: analysis.scorelinePrediction }),
          ...(analysis.likelyScorers && { likelyScorers: analysis.likelyScorers }),
          ...(analysis.teamComparison && { teamComparison: analysis.teamComparison }),
          ...(analysis.marketInsight && { marketInsight: analysis.marketInsight }),
          ...(analysis.tacticalAnalysis && { 
            tacticalAnalysis: typeof analysis.tacticalAnalysis === 'string' 
              ? [analysis.tacticalAnalysis] 
              : Array.isArray(analysis.tacticalAnalysis) 
                ? analysis.tacticalAnalysis 
                : [JSON.stringify(analysis.tacticalAnalysis)]
          }),
          llmModel: analysis.llmModel,
          llmPromptVersion: '1.0',
          processingTimeMs: analysis.processingTimeMs,
        },
      });

      console.log(`✅ Feedback created: ${feedback.id}`);

      // Store citations if they exist
      if (analysis.citations && analysis.citations.length > 0) {
        console.log(`📚 Creating ${analysis.citations.length} citations...`);
        
        for (const citation of analysis.citations) {
          try {
            // First find or create source
            let source = await prisma.source.findFirst({
              where: {
                predictionId: prediction.id,
                url: citation.sourceUrl,
              },
            });

            if (!source) {
              source = await prisma.source.create({
                data: {
                  predictionId: prediction.id,
                  provider: citation.sourceProvider || 'unknown',
                  url: citation.sourceUrl,
                  title: citation.sourceTitle || '',
                  snippet: citation.sourceSnippet || '',
                  fetchedAt: new Date(),
                },
              });
            }

            // Create citation link
            await prisma.citation.create({
              data: {
                feedbackId: feedback.id,
                sourceId: source.id,
                claim: citation.claim,
                excerpt: citation.excerpt,
              },
            });
          } catch (citationError) {
            console.error('Error creating citation:', citationError);
            // Continue with other citations
          }
        }
      }

      // Update prediction status
      await prisma.prediction.update({
        where: { id: predictionId },
        data: { 
          status: 'completed',
          updatedAt: new Date(),
        },
      });

      console.log(`🎉 Successfully processed prediction ${predictionId}`);
      return { 
        success: true, 
        predictionId, 
        feedbackId: feedback.id,
        status: 'completed' 
      };

    } catch (error) {
      console.error(`❌ Error processing prediction ${predictionId}:`, error);
      
      try {
        // Update prediction status to failed
        await prisma.prediction.update({
          where: { id: predictionId },
          data: { 
            status: 'failed',
            updatedAt: new Date(),
          },
        });
      } catch (updateError) {
        console.error('Failed to update prediction status:', updateError);
      }

      throw error;
    }
  },
  { 
    connection,
    concurrency: 2,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);

// Event handlers
worker.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed with error:`, err);
});

worker.on('error', (err) => {
  console.error('🚨 Worker error:', err);
});

console.log('🚀 Feedback worker started and waiting for jobs...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down worker...');
  await worker.close();
  await connection.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down worker...');
  await worker.close();
  await connection.quit();
  process.exit(0);
});
