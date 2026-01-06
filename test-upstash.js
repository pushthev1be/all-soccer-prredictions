const IORedis = require('ioredis');
const { Queue } = require('bullmq');

async function testUpstash() {
  console.log('🧪 Testing Upstash Redis Connection...\n');
  
  const redisUrl = process.env.REDIS_URL || 'rediss://default:AW1nAAIncDIyM2Y2N2Q4YzYwNTU0MjE3YTdkYWQ0OTQ4MTg3MjBjZHAyMjgwMDc@national-crab-28007.upstash.io:6379';
  
  console.log('Connection URL:', redisUrl.replace(/:\/\/.*@/, '://***@'));
  
  const redis = new IORedis(redisUrl, {
    tls: {},
    enableReadyCheck: false,
    connectTimeout: 10000,
    maxRetriesPerRequest: null,
  });

  return new Promise((resolve) => {
    let testsPassed = 0;
    
    redis.on('connect', () => {
      console.log('✅ Connected to Redis');
    });

    redis.on('ready', async () => {
      console.log('✅ Redis ready for commands\n');
      
      try {
        // Test 1: Basic SET/GET
        console.log('Test 1: Basic SET/GET');
        await redis.set('test:key', 'Hello Upstash!');
        const value = await redis.get('test:key');
        console.log(`✅ Value retrieved: ${value}`);
        await redis.del('test:key');
        testsPassed++;
        
        // Test 2: BullMQ Queue
        console.log('\nTest 2: BullMQ Queue');
        const testQueue = new Queue('test-queue', { connection: redis });
        const job = await testQueue.add('test-job', { test: 'data' });
        console.log(`✅ Job added to queue: ${job.id}`);
        
        const waiting = await testQueue.getWaitingCount();
        console.log(`✅ Queue stats - Waiting jobs: ${waiting}`);
        
        await testQueue.obliterate({ force: true });
        console.log('✅ Queue cleaned up');
        testsPassed++;
        
        // Summary
        console.log(`\n🎉 All tests passed! (${testsPassed}/2)`);
        console.log('✅ Upstash Redis is working correctly with BullMQ\n');
        
        await redis.quit();
        resolve(true);
      } catch (error) {
        console.error('❌ Test failed:', error.message);
        await redis.quit();
        resolve(false);
      }
    });

    redis.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message);
      resolve(false);
    });
  });
}

testUpstash().then((success) => {
  process.exit(success ? 0 : 1);
});
