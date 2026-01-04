"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { marketOptions, marketLabels } from "@/lib/prediction-constants";

export default function CreatePredictionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    competition: "",
    homeTeam: "",
    awayTeam: "",
    kickoffTime: "",
    market: "1X2" as keyof typeof marketOptions,
    pick: "",
    odds: "",
    stake: "",
    bookmaker: "",
    reasoning: "",
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push("/auth/signin");
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
          competition: formData.competition,
          homeTeam: formData.homeTeam,
          awayTeam: formData.awayTeam,
          kickoffTime: new Date(formData.kickoffTime).toISOString(),
          market: formData.market,
          pick: formData.pick,
          odds: formData.odds ? parseFloat(formData.odds) : null,
          stake: formData.stake ? parseFloat(formData.stake) : null,
          bookmaker: formData.bookmaker || undefined,
          reasoning: formData.reasoning,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create prediction");
      }

      setSuccess("Prediction created successfully!");
      setTimeout(() => {
        router.push("/predictions");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create prediction");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset pick when market changes
      ...(name === "market" ? { pick: "" } : {}),
    }));
  };

  const currentMarketOptions = marketOptions[formData.market] || [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Prediction</h1>
            <p className="text-gray-600 mt-2">Submit a new soccer match prediction for AI feedback</p>
          </div>
          <Link
            href="/predictions"
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Predictions
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Match Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Match Details</h2>
            
            <div>
              <label htmlFor="competition" className="block text-sm font-medium text-gray-700 mb-1">
                Competition *
              </label>
              <input
                type="text"
                id="competition"
                name="competition"
                value={formData.competition}
                onChange={handleChange}
                required
                placeholder="e.g., Premier League, Champions League"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="homeTeam" className="block text-sm font-medium text-gray-700 mb-1">
                  Home Team *
                </label>
                <input
                  type="text"
                  id="homeTeam"
                  name="homeTeam"
                  value={formData.homeTeam}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Manchester United"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="awayTeam" className="block text-sm font-medium text-gray-700 mb-1">
                  Away Team *
                </label>
                <input
                  type="text"
                  id="awayTeam"
                  name="awayTeam"
                  value={formData.awayTeam}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Liverpool"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="kickoffTime" className="block text-sm font-medium text-gray-700 mb-1">
                Kickoff Time *
              </label>
              <input
                type="datetime-local"
                id="kickoffTime"
                name="kickoffTime"
                value={formData.kickoffTime}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Prediction Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Prediction Details</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="market" className="block text-sm font-medium text-gray-700 mb-1">
                  Market *
                </label>
                <select
                  id="market"
                  name="market"
                  value={formData.market}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(marketLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="pick" className="block text-sm font-medium text-gray-700 mb-1">
                  Pick *
                </label>
                <select
                  id="pick"
                  name="pick"
                  value={formData.pick}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a pick</option>
                  {currentMarketOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="odds" className="block text-sm font-medium text-gray-700 mb-1">
                  Odds
                </label>
                <input
                  type="number"
                  id="odds"
                  name="odds"
                  value={formData.odds}
                  onChange={handleChange}
                  step="0.01"
                  min="1.01"
                  placeholder="e.g., 2.50"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="stake" className="block text-sm font-medium text-gray-700 mb-1">
                  Stake
                </label>
                <input
                  type="number"
                  id="stake"
                  name="stake"
                  value={formData.stake}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="e.g., 10.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="bookmaker" className="block text-sm font-medium text-gray-700 mb-1">
                  Bookmaker
                </label>
                <input
                  type="text"
                  id="bookmaker"
                  name="bookmaker"
                  value={formData.bookmaker}
                  onChange={handleChange}
                  placeholder="e.g., Bet365"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Your Reasoning</h2>
            
            <div>
              <label htmlFor="reasoning" className="block text-sm font-medium text-gray-700 mb-1">
                Why do you think this prediction will win? *
              </label>
              <textarea
                id="reasoning"
                name="reasoning"
                value={formData.reasoning}
                onChange={handleChange}
                required
                rows={4}
                minLength={10}
                placeholder="Explain your reasoning for this prediction (minimum 10 characters)..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.reasoning.length}/10 characters minimum
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Link
              href="/predictions"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Prediction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
