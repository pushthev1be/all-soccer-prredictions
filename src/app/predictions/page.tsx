import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import PredictionsList from "@/components/predictions/predictions-list";

export default async function PredictionsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/backgrounds/stadium-aerial.jpg')",
          }}
        />
        {/* Strong dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-gray-900/80 to-black/75" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-green-600/5" />
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-6 mb-4 sm:mb-8 bg-white p-3 sm:p-6 rounded-lg sm:rounded-2xl shadow-lg border border-gray-100">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-black mb-1 sm:mb-2 tracking-tight">My Predictions</h1>
            <p className="text-xs sm:text-base text-gray-600">View all your submitted predictions and AI feedback</p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Link
              href="/dashboard"
              className="flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 bg-white text-black font-medium text-sm sm:text-base rounded-lg hover:bg-gray-50 transition-all duration-200 border border-gray-300"
            >
              ← Home
            </Link>
            <Link
              href="/predictions/create"
              className="flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium text-sm sm:text-base rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              + New
            </Link>
          </div>
        </div>

        <PredictionsList userId={session.user.id} />
      </div>
    </div>
  );
}
