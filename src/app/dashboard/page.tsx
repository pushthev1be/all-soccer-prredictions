import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { BarChart3, Zap } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
            <p className="text-slate-600">Welcome back, <span className="font-semibold text-emerald-600">{session.user?.name || session.user?.email}</span></p>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button 
              type="submit"
              className="px-6 py-2 bg-slate-200 text-slate-900 font-medium rounded-lg hover:bg-slate-300 transition-colors duration-200"
            >
              Sign Out
            </button>
          </form>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link
            href="/predictions/create"
            className="group p-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-3xl font-bold mb-2">+</div>
            <h3 className="text-xl font-semibold mb-1">Create Prediction</h3>
            <p className="text-emerald-100 text-sm">Submit a new prediction for AI analysis</p>
          </Link>

          <Link
            href="/predictions"
            className="group p-8 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 transform hover:scale-105"
          >
            <BarChart3 className="h-8 w-8 mb-4 opacity-90" />
            <h3 className="text-xl font-semibold mb-1">My Predictions</h3>
            <p className="text-cyan-100 text-sm">View history and AI feedback</p>
          </Link>

          <div className="p-8 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 transition-all duration-300">
            <div className="h-8 w-8 mb-4 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg" />
            <h3 className="text-xl font-semibold mb-1 text-slate-900">Profile</h3>
            <p className="text-slate-600 text-sm">{session.user?.email}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Total Predictions", value: "0", color: "emerald" },
              { label: "Completed", value: "0", color: "cyan" },
              { label: "Pending", value: "0", color: "amber" },
              { label: "Win Rate", value: "--", color: "purple" },
            ].map((stat, i) => {
              const colors = {
                emerald: "from-emerald-500 to-emerald-600",
                cyan: "from-cyan-500 to-cyan-600",
                amber: "from-amber-500 to-amber-600",
                purple: "from-purple-500 to-purple-600",
              };
              return (
                <div key={i} className={`p-6 rounded-xl bg-gradient-to-br ${colors[stat.color as keyof typeof colors]} text-white shadow-lg hover:shadow-xl transition-shadow duration-300`}>
                  <p className="text-white/80 text-sm font-medium mb-2">{stat.label}</p>
                  <p className="text-4xl font-bold">{stat.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Recent Activity</h2>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-slate-100 mb-4">
              <Zap className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-slate-600 mb-4 font-medium">No predictions yet</p>
            <p className="text-slate-500 text-sm mb-6">Create your first prediction to get AI feedback</p>
            <Link
              href="/predictions/create"
              className="inline-flex items-center justify-center px-6 py-2 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors duration-200"
            >
              Create First Prediction
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
