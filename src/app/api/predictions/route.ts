import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { marketOptions } from "@/lib/prediction-constants";

const prisma = new PrismaClient();

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

    // Create prediction
    const prediction = await prisma.prediction.create({
      data: {
        userId: data.userId,
        status: "pending",
        canonicalCompetitionId: `custom:${data.competition.toLowerCase().replace(/\s+/g, "-")}`,
        canonicalHomeTeamId: `custom:${data.homeTeam.toLowerCase().replace(/\s+/g, "-")}`,
        canonicalAwayTeamId: `custom:${data.awayTeam.toLowerCase().replace(/\s+/g, "-")}`,
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

    // TODO: In Phase 2, we'll add background job for AI analysis here
    // For now, just return success

    return NextResponse.json({
      success: true,
      prediction: {
        id: prediction.id,
        status: prediction.status,
        message: "Prediction submitted successfully! AI analysis will begin shortly.",
        estimatedCompletion: "30-60 seconds",
      },
    });

  } catch (error) {
    console.error("Prediction creation error:", error);
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
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

    const predictions = await prisma.prediction.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        feedback: {
          select: {
            id: true,
            summary: true,
            confidenceScore: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: skip,
    });

    const total = await prisma.prediction.count({
      where: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      predictions,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    });

  } catch (error) {
    console.error("Get predictions error:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
