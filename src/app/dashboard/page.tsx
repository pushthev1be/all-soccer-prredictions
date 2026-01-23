import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { BarChart3, Zap } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { BackgroundManager } from "@/components/ui/background-manager";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  const isAdmin = session.user?.email === process.env.ADMIN_EMAIL;

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex">
      <BackgroundManager />
      {/* Admin Sidebar */}
      {isAdmin && (
        <div className="hidden lg:block w-64 bg-gray-900 text-white p-6 relative z-20">
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-2">Admin Panel</h2>
            <p className="text-gray-400 text-sm">{session.user?.email}</p>
          </div>
          
          <nav className="space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800 text-white font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
            
            <Link
              href="/admin/stats"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              User Statistics
            </Link>
            
            <Link
              href="/admin/queue"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
              </svg>
              Queue Status
            </Link>
          </nav>
        </div>
      )}

      {/* Subtle background pattern */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.03]"
          style={{
            backgroundImage: "url('/images/backgrounds/football-pattern.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-green-50/50" />
      </div>

      <div className="flex-1 container-fluid section-spacing relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-8 sm:mb-12 bg-white p-4 sm:p-6 rounded-2xl shadow-lg border-2 border-gray-200">
          <div className="flex items-center gap-3 sm:gap-4">
            <UserAvatar user={session.user} size="lg" />
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-1 sm:mb-2 tracking-tight">Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600">Welcome back, <span className="font-semibold text-black">{session.user?.name || session.user?.email}</span></p>
            </div>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button 
              type="submit"
              className="px-6 py-2 bg-gray-200 text-black font-medium rounded-lg hover:bg-gray-300 transition-colors duration-200"
            >
              Sign Out
            </button>
          </form>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <Link
            href="/predictions/create"
            className="group p-4 sm:p-8 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white border-2 border-blue-500/50 shadow-xl hover:shadow-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-3">+</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Create Prediction</h3>
              <p className="text-blue-100 text-xs sm:text-sm">Submit a new prediction for AI analysis</p>
            </div>
          </Link>

          <Link
            href="/predictions"
            className="group p-4 sm:p-8 rounded-2xl bg-white text-black border-2 border-gray-200 shadow-lg hover:shadow-xl hover:border-blue-300 transition-all duration-300 transform hover:scale-105 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <BarChart3 className="h-8 sm:h-10 w-8 sm:w-10 mb-3 sm:mb-4 text-blue-600" />
              <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">My Predictions</h3>
              <p className="text-gray-600 text-xs sm:text-sm">View history and AI feedback</p>
            </div>
          </Link>

          <div className="p-4 sm:p-8 rounded-2xl bg-white border-2 border-gray-200 shadow-lg hover:border-green-300 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="mb-3 sm:mb-4">
                <UserAvatar user={session.user} size="md" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 text-black">Profile</h3>
              <p className="text-gray-600 text-xs sm:text-sm">{session.user?.email}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight">Your Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[
              { label: "Total Predictions", value: "0", isPrimary: true },
              { label: "Completed", value: "0", isPrimary: false },
              { label: "Pending", value: "0", isPrimary: false },
              { label: "Win Rate", value: "--", isPrimary: false },
            ].map((stat, i) => (
              <div key={i} className={`p-4 sm:p-6 rounded-xl bg-gradient-to-br border-2 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                stat.isPrimary 
                  ? "from-blue-50 to-indigo-50 border-blue-300" 
                  : "from-white to-gray-50 border-gray-200 hover:border-blue-300"
              }`}>
                <p className="text-gray-700 text-xs sm:text-sm font-semibold mb-2 uppercase tracking-wide">{stat.label}</p>
                <p className={`font-extrabold ${
                  stat.isPrimary 
                    ? "text-4xl sm:text-5xl text-blue-600" 
                    : "text-3xl sm:text-4xl text-gray-900"
                }`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-200 p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">Recent Activity</h2>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-blue-300 mb-4 shadow-md">
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-gray-900 mb-2 font-semibold text-lg">No predictions yet</p>
            <p className="text-gray-700 text-sm mb-6 leading-relaxed">Create your first prediction to get AI-powered feedback</p>
            <Link
              href="/predictions/create"
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              Create First Prediction
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
