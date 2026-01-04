export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          All Soccer Predictions
        </h1>
        <p className="text-gray-600 mb-8">
          AI-powered soccer prediction feedback platform
        </p>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Authentication Test</h2>
          <p className="mb-4">Go to: <code>/api/auth/signin</code></p>
          <a 
            href="/api/auth/signin" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            Sign In with Email
          </a>
        </div>
      </div>
    </div>
  );
}