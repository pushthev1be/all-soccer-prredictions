import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Redis connection with graceful failure and Upstash support
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let connection: IORedis | null = null;
let connectionFailed = false;

try {
  const redisConfig: any = {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    enableReadyCheck: false,
    connectTimeout: 10000,
    retryStrategy: (times: number) => {
      // Stop retrying after 3 attempts in dev mode
      if (times > 3 && process.env.DEV_ANALYZE_SYNC === '1') {
        console.log('⚠️  Redis unavailable — using dev sync fallback');
        return null; // Stop retrying
      }
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
  };

  // Add TLS for Upstash (rediss:// protocol)
  if (redisUrl.startsWith('rediss://')) {
    redisConfig.tls = {};
  }

  connection = new IORedis(redisUrl, redisConfig);

  connection.on('error', (err) => {
    if (!connectionFailed) {
      connectionFailed = true;
      console.log('⚠️  Redis not available — queue disabled (dev sync fallback active)');
    }
  });

  connection.on('connect', () => {
    console.log('✓ Redis connected successfully');
  });

  connection.on('ready', () => {
    connectionFailed = false;
    console.log('✓ Redis ready for queue operations');
  });

  // Attempt connection
  connection.connect().catch(() => {
    connectionFailed = true;
  });
} catch (err) {
  console.log('⚠️  Redis initialization failed — queue disabled');
  connectionFailed = true;
}

// Create queue only if connection is available
export const predictionQueue = connection && !connectionFailed
  ? new Queue('predictions', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    })
  : null;

// Helper function to add prediction job
export async function addPredictionJob(predictionId: string, userId: string) {
  if (!predictionQueue) {
    throw new Error('Queue unavailable — Redis not connected');
  }
  return await predictionQueue.add(
    'analyze-prediction',
    { predictionId, userId },
    {
      jobId: `prediction-${predictionId}`,
      priority: 1,
    }
  );
}

// Helper to get queue stats
export async function getQueueStats() {
  if (!predictionQueue) {
    return null;
  }
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      predictionQueue.getWaitingCount(),
      predictionQueue.getActiveCount(),
      predictionQueue.getCompletedCount(),
      predictionQueue.getFailedCount(),
      predictionQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return null;
  }
}