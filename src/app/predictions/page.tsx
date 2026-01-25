import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import PredictionsList from "@/components/predictions/predictions-list";
import { LiveScores } from "@/components/live-scores/live-scores";

export default async function PredictionsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Live Scores Bar */}
      <LiveScores />
      
      <div className="container-fluid section-spacing">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-6 mb-4 sm:mb-8 bg-white p-3 sm:p-6 rounded-lg sm:rounded-2xl border-2 border-black">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-black mb-1 sm:mb-2 tracking-tight">My Predictions</h1>
            <p className="text-xs sm:text-base text-gray-700">View all your submitted predictions and AI feedback</p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Link
              href="/dashboard"
              className="flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 bg-white text-black font-medium text-sm sm:text-base rounded-lg hover:bg-gray-100 transition-all duration-200 border-2 border-black"
            >
              ← Home
            </Link>
            <Link
              href="/predictions/create"
              className="flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 bg-black font-medium text-sm sm:text-base rounded-lg hover:bg-gray-900 transition-all duration-200"
            >
              <span className="text-white">+ New</span>
            </Link>
          </div>
        </div>

        <PredictionsList userId={session.user.id} />
      </div>
    </div>
  );
}
