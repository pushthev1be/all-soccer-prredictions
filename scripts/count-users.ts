import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const totalUsers = await prisma.user.count();
    const usersWithPredictions = await prisma.user.count({
      where: {
        predictions: {
          some: {}
        }
      }
    });

    const totalPredictions = await prisma.prediction.count();
    const avgPredictionsPerUser = usersWithPredictions > 0 ? (totalPredictions / usersWithPredictions).toFixed(2) : 0;

    console.log('📊 User Statistics:');
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Users with Predictions: ${usersWithPredictions}`);
    console.log(`Total Predictions: ${totalPredictions}`);
    console.log(`Avg Predictions/User: ${avgPredictionsPerUser}`);

    // Recent activity
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, email: true, createdAt: true }
    });

    console.log(`\n📅 Last 5 Users:`);
    recentUsers.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.email} - ${new Date(user.createdAt).toLocaleDateString()}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
