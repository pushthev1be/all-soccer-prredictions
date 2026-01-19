import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { SAMPLE_FIXTURES } from "@/lib/fixtures-sample";
import { fetchLiveOdds } from "@/lib/odds-api";
import { addPredictionJob } from "@/lib/queue";

const prisma = new PrismaClient();

const quickSchema = z.object({
  fixtureId: z.string(),
  market: z.string().min(1),
  pick: z.string().min(1),
  stake: z.number().min(0).optional().nullable(),
  reasoning: z.string().min(4).max(1000).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = quickSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
  }

  const { fixtureId, market, pick, stake, reasoning } = parsed.data;
  const fixture = SAMPLE_FIXTURES.find((f) => f.id === fixtureId);
  if (!fixture) {
    return NextResponse.json({ error: "Fixture not found" }, { status: 404 });
  }

  // Try to fetch live odds, fallback to default odds
  const liveOdds = await fetchLiveOdds({
    homeTeam: fixture.homeTeam,
    awayTeam: fixture.awayTeam,
    competitionId: fixture.canonicalCompetitionId,
    kickoffTime: fixture.kickoffTimeUTC,
  });

  // Determine odds value based on pick and live odds availability
  let oddsValue = 2.0; // default fallback
  let bookmaker = "Default";

  if (liveOdds) {
    bookmaker = liveOdds.bookmaker || "The Odds API";
    if (pick === "home" && liveOdds.homeWin) {
      oddsValue = liveOdds.homeWin;
    } else if (pick === "draw" && liveOdds.draw) {
      oddsValue = liveOdds.draw;
    } else if (pick === "away" && liveOdds.awayWin) {
      oddsValue = liveOdds.awayWin;
    }
  }

  try {
    const prediction = await prisma.prediction.create({
      data: {
        userId: session.user.id,
        status: "pending",
        canonicalCompetitionId: fixture.canonicalCompetitionId,
        canonicalHomeTeamId: fixture.canonicalHomeTeamId,
        canonicalAwayTeamId: fixture.canonicalAwayTeamId,
        providerFixtureId: fixture.id,
        kickoffTimeUTC: new Date(fixture.kickoffTimeUTC),
        market,
        pick,
        odds: oddsValue,
        stake: stake ?? null,
        bookmaker: bookmaker,
        reasoning: reasoning || `Quick prediction for ${fixture.homeTeam} vs ${fixture.awayTeam}`,
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

    let jobId: string | null = null;
    try {
      const job = await addPredictionJob(prediction.id, session.user.id);
      if (job?.id !== undefined && job?.id !== null) {
        jobId = job.id.toString();
      }
    } catch (queueErr) {
      console.error("Queue enqueue failed for quick prediction", queueErr);
    }

    return NextResponse.json({
      success: true,
      prediction: {
        id: prediction.id,
        status: prediction.status,
        jobId,
      },
      odds: {
        value: oddsValue,
        bookmaker: bookmaker,
        live: !!liveOdds,
      },
    });
  } catch (err) {
    console.error("Quick prediction error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
