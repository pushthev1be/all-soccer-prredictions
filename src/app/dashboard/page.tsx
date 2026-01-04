import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {session.user?.name || session.user?.email}</span>
            <form action="/api/auth/signout" method="POST">
              <button 
                type="submit"
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create Prediction Card */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Create Prediction</h2>
            <p className="text-gray-600 mb-4">Submit a new soccer match prediction for AI feedback.</p>
            <Link 
              href="/predictions/create"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Create New
            </Link>
          </div>

          {/* My Predictions Card */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">My Predictions</h2>
            <p className="text-gray-600 mb-4">View all your submitted predictions and feedback.</p>
            <Link 
              href="/predictions"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              View All
            </Link>
          </div>

          {/* Profile Card */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Profile</h2>
            <p className="text-gray-600 mb-4">Manage your account settings and preferences.</p>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Email:</span> {session.user?.email}
              </div>
              <div className="text-sm">
                <span className="font-medium">User ID:</span> {session.user?.id}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-gray-600">Predictions</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-gray-600">Completed</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded">
              <div className="text-2xl font-bold text-yellow-600">0</div>
              <div className="text-gray-600">Pending</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded">
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-gray-600">Accuracy</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}