import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { BarChart3, Zap } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { LiveScores } from "@/components/live-scores/live-scores";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  const isAdmin = session.user?.email === process.env.ADMIN_EMAIL;

  // Fetch real user stats
  const userId = session.user.id;
  const [total, completed, pending] = await Promise.all([
    prisma.prediction.count({ where: { userId } }),
    prisma.prediction.count({ where: { userId, status: "completed" } }),
    prisma.prediction.count({ where: { userId, status: "pending" } }),
  ]);

  // Fetch recent predictions for the activity section
  const recentPredictions = await prisma.prediction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      feedback: {
        select: {
          confidenceScore: true,
        },
      },
    },
  });

  const stats = {
    total,
    completed,
    pending,
    winRate: completed > 0 ? "--" : "--", // Win rate would need actual outcome tracking
  };

  return (
    <div className="min-h-screen relative overflow-hidden z-10">
      {/* Live Scores Bar */}
      <LiveScores />
      
      <div className="flex">
      {/* ...existing code... */}
                    {/* Main Content */}
                    <div className="flex-1 container-fluid section-spacing relative z-10">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-10 bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border-2 border-black">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <UserAvatar user={session.user} size="lg" />
                          <div>
                            <h1 className="text-2xl sm:text-4xl font-bold text-black mb-1 tracking-tight">Dashboard</h1>
                            <p className="text-xs sm:text-base text-gray-600">Welcome back, <span className="font-semibold text-black">{session.user?.name || session.user?.email}</span></p>
                          </div>
                        </div>
                        <form action="/api/auth/signout" method="POST">
                          <button 
                            type="submit"
                            className="px-4 sm:px-6 py-2 bg-black text-white font-medium text-sm sm:text-base rounded-lg hover:bg-gray-800 transition-colors duration-200"
                          >
                            Sign Out
                          </button>
                        </form>
                      </div>
                      {/* Quick Actions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-10">
                        <Link
                          href="/predictions/create"
                          className="group p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-black text-white border-2 border-black shadow-lg hover:shadow-xl hover:bg-gray-900 transition-all duration-200"
                        >
                          <div className="text-2xl sm:text-3xl font-bold mb-2">+</div>
                          <h3 className="text-base sm:text-lg font-bold mb-1 text-white">Create Prediction</h3>
                          <p className="text-gray-300 text-xs sm:text-sm">Submit for AI analysis</p>
                        </Link>
                        <Link
                          href="/predictions"
                          className="group p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white text-black border-2 border-black shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-200"
                        >
                          <BarChart3 className="h-6 sm:h-8 w-6 sm:w-8 mb-2 sm:mb-3 text-black" />
                          <h3 className="text-base sm:text-lg font-bold mb-1">My Predictions</h3>
                          <p className="text-gray-600 text-xs sm:text-sm">View history and feedback</p>
                        </Link>
                        <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white border-2 border-black shadow-lg">
                          <div className="mb-2 sm:mb-3">
                            <UserAvatar user={session.user} size="md" />
                          </div>
                          <h3 className="text-base sm:text-lg font-bold mb-1 text-black">Profile</h3>
                          <p className="text-gray-600 text-xs sm:text-sm truncate">{session.user?.email}</p>
                        </div>
                      </div>
                      {/* Stats Cards */}
                      {/* Stats Cards */}
                      <div className="mb-6 sm:mb-10">
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 tracking-tight">Your Statistics</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                          {[
                            { label: "Total", value: stats.total.toString(), isPrimary: true },
                            { label: "Completed", value: stats.completed.toString(), isPrimary: false },
                            { label: "Pending", value: stats.pending.toString(), isPrimary: false },
                            { label: "Win Rate", value: stats.winRate, isPrimary: false },
                          ].map((stat, i) => (
                            <div key={i} className={`p-3 sm:p-5 rounded-xl border-2 shadow-md transition-all duration-200 ${
                              stat.isPrimary 
                                ? "bg-black text-white border-black" 
                                : "bg-white text-black border-black"
                            }`}>
                              <p className={`text-[10px] sm:text-xs font-semibold mb-1 uppercase tracking-wide ${stat.isPrimary ? "text-gray-300" : "text-gray-500"}`}>{stat.label}</p>
                              <p className={`font-black text-2xl sm:text-4xl ${stat.isPrimary ? "text-white" : "text-black"}`}>{stat.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Recent Activity */}
                      <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-black p-4 sm:p-6 shadow-lg">
                        <h2 className="text-lg sm:text-xl font-bold text-black mb-4 tracking-tight">Recent Activity</h2>
                        {recentPredictions.length > 0 ? (
                          <div className="space-y-3">
                            {recentPredictions.map((prediction) => (
                              <Link
                                key={prediction.id}
                                href={`/predictions/${prediction.id}`}
                                className="block p-3 sm:p-4 rounded-lg border-2 border-black hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-black text-sm sm:text-base truncate">
                                      {prediction.market} - {prediction.pick}
                                    </p>
                                    <p className="text-gray-600 text-xs sm:text-sm">
                                      {new Date(prediction.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    prediction.status === "completed" 
                                      ? "bg-black text-white" 
                                      : prediction.status === "pending"
                                      ? "bg-gray-200 text-gray-700"
                                      : "bg-gray-100 text-gray-600"
                                  }`}>
                                    {prediction.status}
                                  </span>
                                </div>
                              </Link>
                            ))}
                            <Link
                              href="/predictions"
                              className="block text-center text-sm text-gray-600 hover:text-black transition-colors pt-2"
                            >
                              View all predictions →
                            </Link>
                          </div>
                        ) : (
                          <div className="text-center py-8 sm:py-10">
                            <div className="inline-flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gray-100 border-2 border-black mb-3">
                              <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-black" />
                            </div>
                            <p className="text-black mb-1 font-bold text-sm sm:text-base">No predictions yet</p>
                            <p className="text-gray-600 text-xs sm:text-sm mb-4">Create your first prediction for AI feedback</p>
                            <Link
                              href="/predictions/create"
                              className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-black font-semibold text-sm sm:text-base rounded-lg hover:bg-gray-800 transition-all duration-200"
                            >
                              <span className="text-white">Create First Prediction</span>
                            </Link>
                          </div>
                        )}
                      </div>
      </div>
  );
}
