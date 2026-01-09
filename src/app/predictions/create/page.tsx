"use client";

import { useState, FormEvent, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { competitions, competitionMap } from "@/lib/competitions";
import { marketOptions, marketLabels } from "@/lib/prediction-constants";
import { LEAGUE_CODES, FootballFixture, LeagueSlug } from "@/lib/football-data";

interface SlipItem {
  id: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  kickoffTime: string;
  market: keyof typeof marketOptions;
  pick: string;
  odds: number;
  bookmaker: string;
  reasoning: string;
}

export default function CreatePredictionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fixtures, setFixtures] = useState<FootballFixture[]>([]);
  const [fixturesLoading, setFixturesLoading] = useState(false);
  const [slipItems, setSlipItems] = useState<SlipItem[]>([]);
  const [multiSlipMode, setMultiSlipMode] = useState(false);

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

  // Calculate combined odds for parlay
  const combinedOdds = slipItems.length > 0 
    ? slipItems.reduce((acc, item) => acc * item.odds, 1).toFixed(2)
    : "0.00";

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

  const handleAddToSlip = () => {
    if (!formData.homeTeam || !formData.awayTeam || !formData.pick || !formData.odds) {
      setError("Please fill in all required fields");
      return;
    }

    const newItem: SlipItem = {
      id: `slip-${Date.now()}`,
      homeTeam: formData.homeTeam,
      awayTeam: formData.awayTeam,
      competition: formData.competition,
      kickoffTime: formData.kickoffTime,
      market: formData.market,
      pick: formData.pick,
      odds: parseFloat(formData.odds),
      bookmaker: formData.bookmaker,
      reasoning: formData.reasoning,
    };

    setSlipItems([...slipItems, newItem]);
    setFormData({
      competition: defaultCompetitionName,
      homeTeam: "",
      awayTeam: "",
      kickoffTime: "",
      market: "1X2",
      pick: "",
      odds: "",
      stake: "",
      bookmaker: "",
      reasoning: "",
    });
    setSuccess("✅ Added to slip!");
    setTimeout(() => setSuccess(""), 2000);
  };

  const handleRemoveFromSlip = (id: string) => {
    setSlipItems(slipItems.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (multiSlipMode && slipItems.length === 0) {
        setError("Add at least one prediction to your slip");
        setLoading(false);
        return;
      }

      if (!multiSlipMode && (!formData.homeTeam || !formData.awayTeam)) {
        setError("Please select a match and fill in all fields");
        setLoading(false);
        return;
      }

      const predictionsToSubmit = multiSlipMode 
        ? slipItems 
        : [formData];

      // Submit each prediction
      for (const prediction of predictionsToSubmit) {
        const response = await fetch("/api/predictions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: session.user.id,
            competition: prediction.competition,
            homeTeam: prediction.homeTeam,
            awayTeam: prediction.awayTeam,
            kickoffTime: new Date(prediction.kickoffTime).toISOString(),
            market: prediction.market,
            pick: prediction.pick,
            odds: prediction.odds ? parseFloat(prediction.odds.toString()) : null,
            stake: formData.stake ? parseFloat(formData.stake) : null,
            bookmaker: prediction.bookmaker || undefined,
            reasoning: prediction.reasoning,
            slipGroupId: multiSlipMode ? `slip-${Date.now()}` : undefined,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create prediction");
        }
      }

      setSuccess(`✅ ${multiSlipMode ? 'Slip' : 'Prediction'} created successfully!`);
      setSlipItems([]);
      setFormData({
        competition: defaultCompetitionName,
        homeTeam: "",
        awayTeam: "",
        kickoffTime: "",
        market: "1X2",
        pick: "",
        odds: "",
        stake: "",
        bookmaker: "",
        reasoning: "",
      });
      setMultiSlipMode(false);

      setTimeout(() => router.push("/predictions"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create prediction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Make a Prediction</h1>
            <p className="text-purple-200">
              {multiSlipMode 
                ? `${slipItems.length} prediction${slipItems.length !== 1 ? 's' : ''} in slip`
                : "Single prediction mode"}
            </p>
          </div>
          <Link
            href="/predictions"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            ← Back
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 text-red-200 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500 text-green-200 rounded-lg">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6 space-y-4">
              {/* Mode Toggle */}
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setMultiSlipMode(false)}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                    !multiSlipMode
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  }`}
                >
                  Single Prediction
                </button>
                <button
                  type="button"
                  onClick={() => setMultiSlipMode(true)}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                    multiSlipMode
                      ? "bg-purple-600 text-white"
                      : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  }`}
                >
                  Multi-Pick Slip
                </button>
              </div>

              {/* League Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Select League</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(LEAGUE_CODES) as LeagueSlug[]).map((slug) => (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => {
                        setSelectedLeague(slug);
                        const comp = competitionMap[slug];
                        if (comp) {
                          setSelectedCompetitionId(slug);
                          setFormData(prev => ({ ...prev, competition: comp.name }));
                        }
                      }}
                      className={`py-2 px-3 rounded-lg font-semibold text-sm transition-colors ${
                        selectedLeague === slug
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                      }`}
                    >
                      {slug.replace("-", " ").toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Available Fixtures */}
              {fixtures.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Available Fixtures</label>
                  <div className="max-h-48 overflow-y-auto space-y-1 bg-slate-900/30 rounded-lg p-3">
                    {fixtures.map((fixture, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleFixtureSelect(fixture)}
                        className="w-full text-left p-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-gray-200 transition-colors"
                      >
                        <span className="font-semibold">{fixture.homeTeam}</span> vs{" "}
                        <span className="font-semibold">{fixture.awayTeam}</span>
                        {fixture.kickoff && (
                          <span className="text-xs text-gray-400 ml-2">
                            {new Date(fixture.kickoff).toLocaleString()}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {fixturesLoading && <p className="text-sm text-gray-400 mt-1">Loading fixtures...</p>}
                </div>
              )}

              {/* Prediction Form */}
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Home Team"
                  value={formData.homeTeam}
                  onChange={(e) => setFormData({ ...formData, homeTeam: e.target.value })}
                  className="col-span-2 sm:col-span-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500"
                />
                <input
                  type="text"
                  placeholder="Away Team"
                  value={formData.awayTeam}
                  onChange={(e) => setFormData({ ...formData, awayTeam: e.target.value })}
                  className="col-span-2 sm:col-span-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500"
                />

                <input
                  type="text"
                  placeholder="Competition"
                  value={formData.competition}
                  onChange={(e) => setFormData({ ...formData, competition: e.target.value })}
                  className="col-span-2 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500"
                />

                <input
                  type="datetime-local"
                  value={formData.kickoffTime}
                  onChange={(e) => setFormData({ ...formData, kickoffTime: e.target.value })}
                  className="col-span-2 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />

                <select
                  value={formData.market}
                  onChange={(e) => setFormData({ ...formData, market: e.target.value as keyof typeof marketOptions })}
                  className="col-span-2 sm:col-span-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  {Object.entries(marketOptions).map(([key, value]) => (
                    <option key={key} value={key}>
                      {marketLabels[key as keyof typeof marketLabels]}
                    </option>
                  ))}
                </select>

                <select
                  value={formData.pick}
                  onChange={(e) => setFormData({ ...formData, pick: e.target.value })}
                  className="col-span-2 sm:col-span-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  <option value="">Select Pick</option>
                  {formData.market && marketOptions[formData.market as keyof typeof marketOptions]?.map((option: any) => (
                    <option key={option.value || option} value={option.value || option}>
                      {option.label || option}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Odds"
                  step="0.01"
                  value={formData.odds}
                  onChange={(e) => setFormData({ ...formData, odds: e.target.value })}
                  className="col-span-2 sm:col-span-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500"
                />

                {!multiSlipMode && (
                  <input
                    type="number"
                    placeholder="Stake"
                    step="0.01"
                    value={formData.stake}
                    onChange={(e) => setFormData({ ...formData, stake: e.target.value })}
                    className="col-span-2 sm:col-span-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500"
                  />
                )}

                <input
                  type="text"
                  placeholder="Bookmaker"
                  value={formData.bookmaker}
                  onChange={(e) => setFormData({ ...formData, bookmaker: e.target.value })}
                  className="col-span-2 sm:col-span-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500"
                />

                <textarea
                  placeholder="Your reasoning..."
                  value={formData.reasoning}
                  onChange={(e) => setFormData({ ...formData, reasoning: e.target.value })}
                  className="col-span-2 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 h-20 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                {multiSlipMode ? (
                  <>
                    <button
                      type="button"
                      onClick={handleAddToSlip}
                      disabled={loading}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Add to Slip
                    </button>
                    <button
                      type="submit"
                      disabled={loading || slipItems.length === 0}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      {loading ? "Submitting..." : `Submit Slip (${slipItems.length})`}
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    {loading ? "Submitting..." : "Make Prediction"}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Slip Sidebar */}
          {multiSlipMode && (
            <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6 h-fit sticky top-8">
              <h2 className="text-xl font-bold text-white mb-4">Slip ({slipItems.length})</h2>

              {slipItems.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No predictions added yet</p>
              ) : (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                    {slipItems.map((item, idx) => (
                      <div key={item.id} className="bg-slate-700/50 border border-slate-600 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-semibold text-purple-300">Pick {idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromSlip(item.id)}
                            className="text-red-400 hover:text-red-300 text-sm font-semibold"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-white font-semibold text-sm mb-1">
                          {item.homeTeam} vs {item.awayTeam}
                        </p>
                        <p className="text-xs text-gray-300 mb-1">
                          <span className="font-semibold">{item.pick}</span> @ {item.odds.toFixed(2)}
                        </p>
                        {item.reasoning && (
                          <p className="text-xs text-gray-400 italic truncate">{item.reasoning}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-600 pt-3">
                    <div className="text-sm text-gray-300 mb-3 space-y-1">
                      <div className="flex justify-between">
                        <span>Individual Odds:</span>
                        <span className="font-mono">
                          {slipItems.map(item => item.odds.toFixed(2)).join(" × ")}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-purple-300">
                        <span>Combined Odds:</span>
                        <span>{combinedOdds}</span>
                      </div>
                    </div>
                    <input
                      type="number"
                      placeholder="Total Stake"
                      step="0.01"
                      value={formData.stake}
                      onChange={(e) => setFormData({ ...formData, stake: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 text-sm mb-2"
                    />
                    {formData.stake && (
                      <p className="text-xs text-gray-300">
                        Potential return: <span className="font-bold text-green-400">
                          {(parseFloat(formData.stake) * parseFloat(combinedOdds)).toFixed(2)}
                        </span>
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
