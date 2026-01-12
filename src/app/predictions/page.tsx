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
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-black mb-2 tracking-tight">My Predictions</h1>
            <p className="text-gray-600">View all your submitted predictions and AI feedback</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-gray-100 text-black font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 border border-gray-200"
            >
              ← Home
            </Link>
            <Link
              href="/predictions/create"
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              + New Prediction
            </Link>
          </div>
        </div>

        <PredictionsList userId={session.user.id} />
      </div>
    </div>
  );
}
