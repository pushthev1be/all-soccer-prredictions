import { getQueueStats, predictionQueue } from '../../src/lib/queue';

async function main() {
  try {
    const stats = await getQueueStats();
    if (!predictionQueue) {
      console.log('Queue: disabled (Redis not connected)');
    }
    if (!stats) {
      console.log('Queue: stats unavailable — worker may not be running or Redis not reachable.');
      process.exit(0);
    }

    const { waiting, active, completed, failed, delayed, total } = stats;
    console.log('Queue Stats');
    console.log('------------');
    console.log(`Waiting   : ${waiting}`);
    console.log(`Active    : ${active}`);
    console.log(`Completed : ${completed}`);
    console.log(`Failed    : ${failed}`);
    console.log(`Delayed   : ${delayed}`);
    console.log(`Total     : ${total}`);

    if (waiting > 0 && active === 0) {
      console.log('\nHint: Jobs are waiting but no worker is active.');
      console.log('Start the worker with "npm run worker" or run both with "npm run dev:all".');
    }
  } catch (err) {
    console.error('Error fetching queue stats:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
