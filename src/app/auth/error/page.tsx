import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center py-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            All Soccer Predictions
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            AI-powered soccer prediction feedback platform. Submit your match predictions and receive evidence-based analysis.
          </p>
          <div className="space-x-4">
            <a 
              href="/api/auth/signin" 
              className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
            >
              Get Started Free
            </a>
            <a 
              href="#features" 
              className="inline-block border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-blue-600 text-4xl mb-4">1</div>
              <h3 className="text-xl font-semibold mb-4">Submit Prediction</h3>
              <p className="text-gray-600">
                Select a match, add your market, odds, and reasoning for your bet.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-blue-600 text-4xl mb-4">2</div>
              <h3 className="text-xl font-semibold mb-4">AI Analysis</h3>
              <p className="text-gray-600">
                Our system gathers data, analyzes trends, and provides evidence-based feedback.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-blue-600 text-4xl mb-4">3</div>
              <h3 className="text-xl font-semibold mb-4">Learn & Improve</h3>
              <p className="text-gray-600">
                Review AI feedback with citations to improve your prediction skills.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h2>
          <a 
            href="/api/auth/signin" 
            className="inline-block bg-green-600 text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition"
          >
            Sign Up Free
          </a>
          <p className="text-gray-500 mt-4">
            No credit card required. Start with 5 free predictions.
          </p>
        </div>
      </div>
    </div>
  );
}