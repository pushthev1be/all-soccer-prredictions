import { NextResponse } from 'next/server';
import { getQueueStats } from '@/lib/queue';

export async function GET() {
  try {
    const stats = await getQueueStats();
    
    if (!stats) {
      return NextResponse.json(
        { 
          error: 'Failed to retrieve queue stats',
          message: 'Redis connection may be down or queue is not initialized'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching queue stats:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
