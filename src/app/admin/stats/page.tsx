import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Users, FileText, TrendingUp, Clock, ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function AdminStatsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  // Check if user is admin
  const isAdmin = session.user?.email === process.env.ADMIN_EMAIL;
  
  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Fetch stats
  const [
    totalUsers,
    usersWithPredictions,
    totalPredictions,
    pendingPredictions,
    settledPredictions,
    predictionsWithFeedback,
    recentUsers,
    topUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        predictions: {
          some: {},
        },
      },
    }),
    prisma.prediction.count(),
    prisma.prediction.count({ where: { status: "pending" } }),
    prisma.prediction.count({ where: { status: { in: ["won", "lost", "void"] } } }),
    prisma.prediction.count({ where: { feedback: { isNot: null } } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        _count: {
          select: { predictions: true },
        },
      },
    }),
    prisma.user.findMany({
      orderBy: {
        predictions: {
          _count: "desc",
        },
      },
      take: 5,
      include: {
        _count: {
          select: { predictions: true },
        },
      },
    }),
  ]);

  const avgPredictionsPerUser = totalUsers > 0 ? (totalPredictions / totalUsers).toFixed(2) : "0";
  const feedbackPercentage = totalPredictions > 0 
    ? ((predictionsWithFeedback / totalPredictions) * 100).toFixed(1) 
    : "0";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Admin Statistics</h1>
          <p className="text-gray-600 mt-2">System overview and user analytics</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-700">Total Users</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
            <p className="text-sm text-gray-500 mt-1">{usersWithPredictions} active</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-700">Predictions</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalPredictions}</p>
            <p className="text-sm text-gray-500 mt-1">{avgPredictionsPerUser} avg/user</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-700">Pending</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{pendingPredictions}</p>
            <p className="text-sm text-gray-500 mt-1">{settledPredictions} settled</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-700">AI Feedback</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{predictionsWithFeedback}</p>
            <p className="text-sm text-gray-500 mt-1">{feedbackPercentage}% coverage</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Users</h2>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{user.email}</p>
                    <p className="text-xs text-gray-500">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{user._count.predictions}</p>
                    <p className="text-xs text-gray-500">predictions</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Users */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Most Active Users</h2>
            <div className="space-y-3">
              {topUsers.map((user, index) => (
                <div key={user.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.email}</p>
                      <p className="text-xs text-gray-500">
                        Member since {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{user._count.predictions}</p>
                    <p className="text-xs text-gray-500">predictions</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
