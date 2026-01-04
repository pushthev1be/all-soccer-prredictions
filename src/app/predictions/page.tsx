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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Predictions</h1>
            <p className="text-gray-600 mt-2">View all your submitted predictions and AI feedback</p>
          </div>
          <Link
            href="/predictions/create"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            + New Prediction
          </Link>
        </div>

        <PredictionsList userId={session.user.id} />
      </div>
    </div>
  );
}
