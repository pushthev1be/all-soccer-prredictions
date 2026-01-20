"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const result = await signIn("email", { email, redirect: false });
      
      if (result?.error) {
        setError("Failed to send sign-in email. Please try again.");
        setLoading(false);
      } else {
        router.push("/auth/verify-request");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleTestLogin = async (e: FormEvent) => {
    e.preventDefault();
    setTestLoading(true);
    setError("");
    
    try {
      const result = await signIn("test", { email, callbackUrl: "/dashboard" });
      
      if (result?.error) {
        setError("Failed to sign in. Please try again.");
        setTestLoading(false);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setTestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/backgrounds/stadium.jpg')",
          }}
        />
        {/* Strong dark overlay to prevent UI fade-through */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-gray-900/85 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-green-600/10" />
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md border border-gray-200 relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-3 sm:mb-4 shadow-lg">
            <svg className="w-6 sm:w-8 h-6 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Welcome Back</h1>
          <p className="text-sm sm:text-base text-gray-600">Sign in to access your predictions</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400"
              placeholder="your@email.com"
            />
          </div>

          <button
            type="button"
            onClick={handleTestLogin}
            disabled={testLoading || !email}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {testLoading ? "Signing in..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
