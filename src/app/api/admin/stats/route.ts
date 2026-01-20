import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin-only access - replace with your email
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'your-email@gmail.com';
    if (session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden - Admin access only' }, { status: 403 });
    }

    const totalUsers = await prisma.user.count();
    const usersWithPredictions = await prisma.user.count({
      where: {
        predictions: {
          some: {}
        }
      }
    });

    const totalPredictions = await prisma.prediction.count();
    const pendingPredictions = await prisma.prediction.count({
      where: { status: 'pending' }
    });
    const settledPredictions = await prisma.prediction.count({
      where: { status: { in: ['won', 'lost', 'void'] } }
    });

    const avgPredictionsPerUser = usersWithPredictions > 0 
      ? (totalPredictions / usersWithPredictions).toFixed(2) 
      : 0;

    // Recent users
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { 
        id: true, 
        email: true, 
        name: true,
        createdAt: true,
        _count: {
          select: { predictions: true }
        }
      }
    });

    // Top users by prediction count
    const topUsers = await prisma.user.findMany({
      take: 5,
      orderBy: {
        predictions: { _count: 'desc' }
      },
      select: {
        id: true,
        email: true,
        name: true,
        _count: {
          select: { predictions: true }
        }
      },
      where: {
        predictions: {
          some: {}
        }
      }
    });

    // Predictions with feedback
    const predictionsWithFeedback = await prisma.prediction.count({
      where: {
        feedback: {
          isNot: null
        }
      }
    });

    const stats = {
      users: {
        total: totalUsers,
        withPredictions: usersWithPredictions,
        avgPredictionsPerUser
      },
      predictions: {
        total: totalPredictions,
        pending: pendingPredictions,
        settled: settledPredictions,
        withFeedback: predictionsWithFeedback,
        feedbackPercentage: totalPredictions > 0 
          ? ((predictionsWithFeedback / totalPredictions) * 100).toFixed(1) 
          : 0
      },
      recentUsers,
      topUsers
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
