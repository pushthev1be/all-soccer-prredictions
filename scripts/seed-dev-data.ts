import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getOrCreateDevUser() {
  const email = 'dev@example.com';
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, name: 'Dev User' },
    });
  }
  return user;
}

async function clearUserPredictions(userId: string) {
  const predictions = await prisma.prediction.findMany({
    where: { userId },
    select: { id: true },
  });
  const predictionIds = predictions.map(p => p.id);

  if (predictionIds.length > 0) {
    // Gather feedback IDs
    const feedbacks = await prisma.feedback.findMany({
      where: { predictionId: { in: predictionIds } },
      select: { id: true },
    });
    const feedbackIds = feedbacks.map(f => f.id);

    if (feedbackIds.length > 0) {
      await prisma.citation.deleteMany({ where: { feedbackId: { in: feedbackIds } } });
    }

    await prisma.source.deleteMany({ where: { predictionId: { in: predictionIds } } });
    await prisma.feedback.deleteMany({ where: { predictionId: { in: predictionIds } } });
    await prisma.prediction.deleteMany({ where: { id: { in: predictionIds } } });
  }
}

async function seedPredictions(userId: string) {
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  const base = {
    userId,
    canonicalCompetitionId: 'custom:premier-league',
    bookmaker: 'Bet365',
  };

  // Completed (won)
  const compWon = await prisma.prediction.create({
    data: {
      ...base,
      status: 'completed',
      canonicalHomeTeamId: 'custom:manchester-united',
      canonicalAwayTeamId: 'custom:manchester-city',
      kickoffTimeUTC: new Date(now.getTime() - 2 * day),
      market: '1X2',
      pick: 'home',
      odds: 2.5,
      stake: 100,
      reasoning: 'Home advantage and strong recent form.',
      result: 'won',
      resultUpdatedAt: new Date(now.getTime() - 2 * day + 2 * 60 * 60 * 1000),
    },
  });

  await prisma.feedback.create({
    data: {
      predictionId: compWon.id,
      summary: 'Solid pick supported by home form and stats.',
      strengths: ['Home form', 'Midfield control'],
      risks: ['Counter-attacks'],
      missingChecks: ['Referee style'],
      contradictions: ['Market implied probability slightly lower'],
      keyFactors: ['Set pieces', 'Tactical setup'],
      whatWouldChangeMyMind: ['Key injury', 'Weather shift'],
      dataQualityNotes: ['Basic public sources used'],
      confidenceExplanation: 'High confidence due to form alignment.',
      confidenceScore: 0.78,
      llmModel: 'mock-analyzer-v1',
      llmPromptVersion: '1.0',
      processingTimeMs: 1500,
    },
  });

  // Completed (lost)
  const compLost = await prisma.prediction.create({
    data: {
      ...base,
      status: 'completed',
      canonicalHomeTeamId: 'custom:liverpool',
      canonicalAwayTeamId: 'custom:arsenal',
      kickoffTimeUTC: new Date(now.getTime() - day),
      market: 'over-under',
      pick: 'over-2.5',
      odds: 1.8,
      stake: 100,
      reasoning: 'Both teams scoring heavily in recent fixtures.',
      result: 'lost',
      resultUpdatedAt: new Date(now.getTime() - day + 2 * 60 * 60 * 1000),
    },
  });

  await prisma.feedback.create({
    data: {
      predictionId: compLost.id,
      summary: 'High-scoring expectation did not materialize.',
      strengths: ['Attack form trending up'],
      risks: ['Defensive improvements under new tactics'],
      missingChecks: ['Weather impact', 'In-game injuries'],
      contradictions: ['Odds suggested moderate likelihood'],
      keyFactors: ['Pressing intensity', 'Fixture congestion'],
      whatWouldChangeMyMind: ['Rest rotations'],
      dataQualityNotes: ['Limited injury verification'],
      confidenceExplanation: 'Moderate confidence affected by incomplete data.',
      confidenceScore: 0.62,
      llmModel: 'mock-analyzer-v1',
      llmPromptVersion: '1.0',
      processingTimeMs: 1600,
    },
  });

  // Processing (live)
  await prisma.prediction.create({
    data: {
      ...base,
      status: 'processing',
      canonicalHomeTeamId: 'custom:real-madrid',
      canonicalAwayTeamId: 'custom:barcelona',
      kickoffTimeUTC: new Date(now.getTime() - 60 * 60 * 1000),
      market: 'double-chance',
      pick: '1x',
      odds: 1.4,
      stake: 100,
      reasoning: 'Strong home record in El Clásico.',
    },
  });

  // Pending (future)
  await prisma.prediction.create({
    data: {
      ...base,
      status: 'pending',
      canonicalHomeTeamId: 'custom:chelsea',
      canonicalAwayTeamId: 'custom:tottenham',
      kickoffTimeUTC: new Date(now.getTime() + day),
      market: 'btts',
      pick: 'yes',
      odds: 1.65,
      stake: 100,
      reasoning: 'Derby match with both teams attacking.',
    },
  });

  // Failed (processing error)
  await prisma.prediction.create({
    data: {
      ...base,
      status: 'failed',
      canonicalHomeTeamId: 'custom:juventus',
      canonicalAwayTeamId: 'custom:inter',
      kickoffTimeUTC: new Date(now.getTime() + 2 * day),
      market: 'dnb',
      pick: 'home',
      odds: 1.9,
      stake: 100,
      reasoning: 'Home team stability and form.',
    },
  });
}

async function main() {
  console.log('🌱 Seeding development data (mixed statuses)...');
  const user = await getOrCreateDevUser();
  await clearUserPredictions(user.id);
  await seedPredictions(user.id);

  const counts = await prisma.prediction.groupBy({
    by: ['status'],
    where: { userId: user.id },
    _count: { _all: true },
  });

  console.log('✅ Seed complete for user:', user.email);
  for (const c of counts) {
    console.log(`  - ${c.status}: ${c._count._all}`);
  }
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
