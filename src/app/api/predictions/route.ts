import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { marketOptions } from "@/lib/prediction-constants";
import { addPredictionJob } from "@/lib/queue";
import { analyzePrediction } from "@/lib/ai-analyzer";

// Validation schema
const predictionSchema = z.object({
  userId: z.string(),
  competition: z.string().min(1, "Competition is required"),
  homeTeam: z.string().min(1, "Home team is required"),
  awayTeam: z.string().min(1, "Away team is required"),
  kickoffTime: z.string().datetime(),
  market: z.enum(["1X2", "double-chance", "over-under", "btts", "asian-handicap", "correct-score", "dnb"]),
  pick: z.string().min(1, "Pick is required"),
  odds: z.number().min(1.01).optional().nullable(),
  stake: z.number().min(0).optional().nullable(),
  bookmaker: z.string().optional(),
  reasoning: z.string().min(10, "Reasoning must be at least 10 characters"),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    
    const validation = predictionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Validate that pick is valid for selected market
    const validPicks = marketOptions[data.market]?.map(opt => opt.value) || [];
    if (!validPicks.includes(data.pick)) {
      return NextResponse.json(
        { error: "Invalid pick for selected market" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Generate canonical IDs
    const competitionSlug = data.competition.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, '');
    const homeTeamSlug = data.homeTeam.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, '');
    const awayTeamSlug = data.awayTeam.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, '');

    // Create prediction
    const prediction = await prisma.prediction.create({
      data: {
        userId: data.userId,
        status: "pending",
        canonicalCompetitionId: `custom:${competitionSlug}`,
        canonicalHomeTeamId: `custom:${homeTeamSlug}`,
        canonicalAwayTeamId: `custom:${awayTeamSlug}`,
        kickoffTimeUTC: new Date(data.kickoffTime),
        market: data.market,
        pick: data.pick,
        odds: data.odds,
        stake: data.stake,
        bookmaker: data.bookmaker,
        reasoning: data.reasoning,
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    console.log(`✅ Prediction created: ${prediction.id}`);

    try {
      // Dev synchronous analysis mode: bypass queue when enabled
      const devSync = process.env.DEV_ANALYZE_SYNC === "1" || process.env.NODE_ENV === "development" && process.env.DEV_ANALYZE_SYNC === "1";
      if (devSync) {
        console.log("⚙️ Dev sync mode enabled — running analysis synchronously");
        const analysis = await analyzePrediction(prediction);

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
            ...(analysis.tacticalAnalysis && { tacticalAnalysis: JSON.stringify(analysis.tacticalAnalysis) as any }),
            llmModel: analysis.llmModel,
            llmPromptVersion: "1.0",
            processingTimeMs: analysis.processingTimeMs,
          },
        });

        await prisma.prediction.update({
          where: { id: prediction.id },
          data: { status: "completed", updatedAt: new Date() },
        });

        return NextResponse.json({
          success: true,
          prediction: {
            id: prediction.id,
            status: "completed",
            message: "Analysis completed synchronously in dev mode.",
          },
          feedback: {
            id: feedback.id,
            confidenceScore: feedback.confidenceScore,
          },
          system: {
            mode: "dev-sync",
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Queue the analysis job
      const job = await addPredictionJob(prediction.id, data.userId);
      console.log(`📤 Job ${job.id} added to queue for prediction ${prediction.id}`);

      return NextResponse.json({
        success: true,
        prediction: {
          id: prediction.id,
          status: "pending",
          message: "Prediction submitted successfully! AI analysis has been queued.",
          estimatedCompletion: "30-60 seconds",
          jobId: job.id,
        },
        queueInfo: {
          jobId: job.id,
          status: "queued",
          timestamp: new Date().toISOString(),
        },
      });

    } catch (queueError) {
      console.error("❌ Failed to queue job:", queueError);

      // Dev-only synchronous analysis fallback to avoid stuck pending
      const devSync = process.env.DEV_ANALYZE_SYNC === "1" || process.env.NODE_ENV === "development";
      if (devSync) {
        try {
          console.log("⚙️ Queue unavailable — running synchronous analysis (dev mode)");
          const analysis = await analyzePrediction(prediction);

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
              ...(analysis.tacticalAnalysis && { tacticalAnalysis: JSON.stringify(analysis.tacticalAnalysis) as any }),
              llmModel: analysis.llmModel,
              llmPromptVersion: "1.0",
              processingTimeMs: analysis.processingTimeMs,
            },
          });

          await prisma.prediction.update({
            where: { id: prediction.id },
            data: { status: "completed", updatedAt: new Date() },
          });

          return NextResponse.json({
            success: true,
            prediction: {
              id: prediction.id,
              status: "completed",
              message: "Analysis completed synchronously in development mode.",
            },
            feedback: {
              id: feedback.id,
              confidenceScore: feedback.confidenceScore,
            },
            system: {
              mode: "dev-sync",
              timestamp: new Date().toISOString(),
            },
          });
        } catch (syncError) {
          console.error("❌ Dev-sync analysis failed:", syncError);
          // Fall through to marking failed
        }
      }

      // Update prediction status to indicate queue failure
      await prisma.prediction.update({
        where: { id: prediction.id },
        data: { status: "failed", updatedAt: new Date() },
      });

      return NextResponse.json({
        success: false,
        prediction: {
          id: prediction.id,
          status: "failed",
          message: "Prediction saved but failed to queue for analysis. Please try again.",
        },
        error: "Queue system unavailable",
      }, { status: 500 });
    }

  } catch (error) {
    console.error("❌ Prediction creation error:", error);
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Get user's predictions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = parseInt(searchParams.get("skip") || "0");
    const status = searchParams.get("status"); // Optional filter by status

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    const predictions = await prisma.prediction.findMany({
      where,
      include: {
        feedback: {
          select: {
            id: true,
            summary: true,
            confidenceScore: true,
            createdAt: true,
          },
        },
        sources: {
          select: {
            id: true,
            provider: true,
            title: true,
          },
          take: 2, // Limit sources in list view
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: skip,
    });

    const total = await prisma.prediction.count({ where });

    // Get queue stats if available (with timeout to prevent hanging)
    let queueStats = null;
    let workerHint: string | null = null;
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Queue stats timeout')), 2000)
      );
      const statsPromise = (async () => {
        const { getQueueStats } = await import('@/lib/queue');
        return await getQueueStats();
      })();
      queueStats = await Promise.race([statsPromise, timeoutPromise]) as any;
      if (queueStats && queueStats.waiting > 0 && queueStats.active === 0) {
        workerHint = 'Jobs are waiting but no worker is active. Start the worker with "npm run worker" or run both with "npm run dev:all".';
      }
    } catch (queueError) {
      // Queue stats unavailable or timed out - continue without them
    }

    return NextResponse.json({
      predictions,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
      user: {
        id: session.user.id,
        email: session.user.email,
        totalPredictions: total,
      },
      system: {
        queueStats,
        workerHint,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("❌ Get predictions error:", error);
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
