"use client";

import { useState, FormEvent, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { competitions, competitionMap } from "@/lib/competitions";
import { marketOptions, marketLabels } from "@/lib/prediction-constants";
import { LEAGUE_CODES, FootballFixture, LeagueSlug } from "@/lib/football-data";

export default function CreatePredictionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fixtures, setFixtures] = useState<FootballFixture[]>([]);
  const [fixturesLoading, setFixturesLoading] = useState(false);

  const defaultCompetitionId = "premier-league";
  const defaultCompetitionName = competitionMap[defaultCompetitionId]?.name || competitions[0]?.name || "";

  const [selectedCompetitionId, setSelectedCompetitionId] = useState(defaultCompetitionId);
  const [selectedLeague, setSelectedLeague] = useState<LeagueSlug>("premier-league");
  const [formData, setFormData] = useState({
    competition: defaultCompetitionName,
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

  const activeCompetition = useMemo(() => competitionMap[selectedCompetitionId] ?? competitions[0], [selectedCompetitionId]);
  const competitionTeams = activeCompetition?.teams || [];
  const competitionFixtures = activeCompetition?.fixtures || [];

  // Fetch real fixtures from Football Data API
  useEffect(() => {
    async function loadFixtures() {
      if (!selectedLeague) return;
      
      setFixturesLoading(true);
      try {
        const response = await fetch(`/api/fixtures?league=${selectedLeague}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          setFixtures(data.fixtures || []);
        }
      } catch (err) {
        console.error("Error loading fixtures:", err);
        setFixtures([]);
      } finally {
        setFixturesLoading(false);
      }
    }

    loadFixtures();
  }, [selectedLeague]);

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

  const handleFixtureSelect = (fixture: FootballFixture) => {
    setFormData(prev => ({
      ...prev,
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      competition: fixture.competition,
      kickoffTime: fixture.kickoff ? new Date(fixture.kickoff).toISOString().slice(0, 16) : "",
      odds: fixture.odds?.homeWin ? fixture.odds.homeWin.toString() : "",
    }));
  };

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

  const handleCompetitionChange = (value: string) => {
    const nextCompetition = competitionMap[value] || competitions.find((c) => c.id === value);
    setSelectedCompetitionId(value);
    setFormData((prev) => ({
      ...prev,
      competition: nextCompetition?.name || value,
      homeTeam: "",
      awayTeam: "",
    }));
  };

  const handleFixtureSelect = (fixture: { home: string; away: string; kickoff: string }) => {
    const localKickoff = new Date(fixture.kickoff);
    const localValue = localKickoff.toISOString().slice(0, 16);
    setFormData((prev) => ({
      ...prev,
      homeTeam: fixture.home,
      awayTeam: fixture.away,
      kickoffTime: localValue,
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
          {/* Football Data League Selection */}
          <div className="space-y-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-900">⚽ Real Fixtures from Football Data</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select League</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(LEAGUE_CODES).map(([slug, config]) => (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => setSelectedLeague(slug as LeagueSlug)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      selectedLeague === slug
                        ? "bg-blue-600 text-white ring-2 ring-blue-300"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {config.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Upcoming Fixtures */}
            {fixturesLoading ? (
              <div className="flex items-center gap-2 text-gray-600">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                Loading fixtures...
              </div>
            ) : fixtures.length > 0 ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Matches</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {fixtures.map((fixture) => (
                    <button
                      key={fixture.id}
                      type="button"
                      onClick={() => handleFixtureSelect(fixture)}
                      className="w-full text-left p-3 rounded-lg border border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all"
                    >
                      <div className="font-medium text-gray-900">
                        {fixture.homeTeam} vs {fixture.awayTeam}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {new Date(fixture.kickoff).toLocaleDateString()} at{" "}
                        {new Date(fixture.kickoff).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {fixture.odds?.homeWin && ` • Odds: ${fixture.odds.homeWin}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-gray-600 text-sm">No upcoming fixtures found for this league.</div>
            )}
          </div>

          {/* Match Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Match Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="competition-select" className="block text-sm font-medium text-gray-700 mb-1">
                  League or Competition *
                </label>
                <select
                  id="competition-select"
                  name="competition-select"
                  value={selectedCompetitionId}
                  onChange={(e) => setSelectedCompetitionId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {competitions.map((competition) => (
                    <option key={competition.id} value={competition.id}>
                      {competition.icon ? `${competition.icon} ` : ""}{competition.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="competition" className="block text-sm font-medium text-gray-700 mb-1">
                  Competition (auto-filled)
                </label>
                <input
                  type="text"
                  id="competition"
                  name="competition"
                  value={formData.competition}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-md"
                />
              </div>
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
                  placeholder="Auto-filled from fixture or enter manually"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
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
                  placeholder="Auto-filled from fixture or enter manually"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
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

            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Upcoming fixtures in {activeCompetition?.name}</h3>
                <span className="text-xs text-gray-500">Tap to auto-fill</span>
              </div>
              {competitionFixtures.length > 0 ? (
                <div className="grid gap-3">
                  {competitionFixtures.map((fixture) => {
                    const formatted = new Date(fixture.kickoff).toLocaleString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <button
                        type="button"
                        key={`${fixture.home}-${fixture.away}-${fixture.kickoff}`}
                        onClick={() => handleFixtureSelect(fixture)}
                        className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white text-left hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
                      >
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 group-hover:bg-emerald-600"></div>
                            <span className="font-medium text-gray-900 group-hover:text-emerald-700">
                              {fixture.home} vs {fixture.away}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            {activeCompetition?.name} - {formatted}
                          </div>
                        </div>
                        <div className="text-emerald-600 group-hover:text-emerald-700">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center rounded-xl border border-dashed border-gray-200 bg-white">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-700 mb-1">No upcoming fixtures</h4>
                  <p className="text-sm text-gray-500">Select another competition to see upcoming matches.</p>
                </div>
              )}
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
