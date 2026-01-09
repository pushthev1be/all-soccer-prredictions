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
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8 border-b border-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.05)] rounded-b-3xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-black mb-2 tracking-tight drop-shadow-sm">Dashboard</h1>
            <p className="text-gray-600">Welcome back, <span className="font-semibold text-black">{session.user?.name || session.user?.email}</span></p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link
            href="/predictions/create"
            className="group p-8 rounded-xl bg-black text-white border border-black shadow-sm hover:shadow-lg hover:bg-gray-900 transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-3xl font-bold mb-2">+</div>
            <h3 className="text-xl font-semibold mb-1">Create Prediction</h3>
            <p className="text-gray-300 text-sm">Submit a new prediction for AI analysis</p>
          </Link>

          <Link
            href="/predictions"
            className="group p-8 rounded-xl bg-gray-100 text-black border border-black/10 shadow-sm hover:shadow-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
          >
            <BarChart3 className="h-8 w-8 mb-4 opacity-80" />
            <h3 className="text-xl font-semibold mb-1">My Predictions</h3>
            <p className="text-gray-600 text-sm">View history and AI feedback</p>
          </Link>

          <div className="p-8 rounded-xl bg-white border-2 border-black/10 shadow-sm hover:border-black transition-all duration-300">
            <div className="h-8 w-8 mb-4 bg-gray-300 rounded-lg" />
            <h3 className="text-xl font-semibold mb-1 text-black">Profile</h3>
            <p className="text-gray-600 text-sm">{session.user?.email}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-black mb-6 tracking-tight drop-shadow-sm">Your Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Total Predictions", value: "0" },
              { label: "Completed", value: "0" },
              { label: "Pending", value: "0" },
              { label: "Win Rate", value: "--" },
            ].map((stat, i) => (
              <div key={i} className="p-6 rounded-xl bg-gray-100 text-black border border-black/10 shadow-sm hover:shadow-md transition-shadow duration-300">
                <p className="text-gray-600 text-sm font-medium mb-2">{stat.label}</p>
                <p className="text-4xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-50 rounded-xl border border-black/10 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-black mb-6 tracking-tight drop-shadow-sm">Recent Activity</h2>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-300 mb-4">
              <Zap className="h-6 w-6 text-gray-600" />
            </div>
            <p className="text-gray-700 mb-4 font-medium">No predictions yet</p>
            <p className="text-gray-600 text-sm mb-6">Create your first prediction to get AI feedback</p>
            <Link
              href="/predictions/create"
              className="inline-flex items-center justify-center px-6 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-colors duration-200"
            >
              Create First Prediction
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
