"use client";

import { useState, FormEvent, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { competitions, competitionMap } from "@/lib/competitions";
import { marketOptions, marketLabels } from "@/lib/prediction-constants";
import { LEAGUE_CODES, FootballFixture, LeagueSlug } from "@/lib/football-data";
import type { OddsResult } from "@/lib/odds-api";

interface SlipItem {
  id: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  kickoffTime: string;
  createdAt: string;
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
  const [liveOdds, setLiveOdds] = useState<OddsResult | null>(null);
  const [oddsLoading, setOddsLoading] = useState(false);
  const [oddsError, setOddsError] = useState("");
  const [oddsNotice, setOddsNotice] = useState("");

  const defaultCompetitionId = "premier-league";
  const defaultCompetitionName = competitionMap[defaultCompetitionId]?.name || competitions[0]?.name || "";

  const [selectedCompetitionId, setSelectedCompetitionId] = useState(defaultCompetitionId);
  const [selectedLeague, setSelectedLeague] = useState<LeagueSlug>("premier-league");
  const [selectedMarket, setSelectedMarket] = useState<keyof typeof marketOptions>("1X2");
  const [selectedBookmakers, setSelectedBookmakers] = useState<string[]>([]);
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

  const pickOddsForSelection = (
    pick: string,
    odds?: any
  ): number | null => {
    if (!odds) return null;
    
    // For h2h (1X2) market
    if (selectedMarket === "1X2") {
      if (pick === "home") return odds.homeWin ?? null;
      if (pick === "draw") return odds.draw ?? null;
      if (pick === "away") return odds.awayWin ?? null;
    }
    
    // For totals (over/under) market
    if (selectedMarket === "over-under") {
      if (pick === "over") return odds.over ?? null;
      if (pick === "under") return odds.under ?? null;
    }
    
    // For btts market
    if (selectedMarket === "btts") {
      if (pick === "yes") return odds.btts_yes ?? null;
      if (pick === "no") return odds.btts_no ?? null;
    }
    
    return null;
  };

  const applyLiveOddsToForm = (
    incomingOdds: typeof liveOdds,
    pickValue?: string
  ) => {
    if (!incomingOdds) return;
    
    // Get the first valid pick for the market if no pick selected
    let defaultPick = pickValue || formData.pick;
    if (!defaultPick && formData.market) {
      const options = marketOptions[formData.market as keyof typeof marketOptions];
      if (options && options.length > 0) {
        defaultPick = (options[0] as any)?.value || options[0];
      }
    }
    
    const oddsForPick = pickOddsForSelection(defaultPick, incomingOdds);

    setFormData((prev) => ({
      ...prev,
      odds: oddsForPick ? oddsForPick.toString() : prev.odds,
      bookmaker: incomingOdds.bookmaker || prev.bookmaker,
    }));
  };

  const fetchLiveOddsForMatch = async (homeOverride?: string, awayOverride?: string) => {
    const homeTeam = homeOverride || formData.homeTeam;
    const awayTeam = awayOverride || formData.awayTeam;

    if (!homeTeam || !awayTeam) {
      setOddsError("Select both teams to load live odds");
      return;
    }

    setOddsLoading(true);
    setOddsError("");
    setOddsNotice("");

    try {
      const params = new URLSearchParams({
        homeTeam,
        awayTeam,
      });

      if (selectedCompetitionId) {
        params.append("competitionId", selectedCompetitionId);
      }

      if (selectedMarket) {
        const marketKey = selectedMarket === "1X2" ? "h2h" : selectedMarket === "over-under" ? "totals" : selectedMarket === "btts" ? "btts" : selectedMarket;
        params.append("market", marketKey);
      }

      if (selectedBookmakers.length > 0) {
        params.append("bookmakers", selectedBookmakers.join(","));
      }

      if (formData.kickoffTime) {
        params.append("kickoff", new Date(formData.kickoffTime).toISOString());
      }

      const response = await fetch(`/api/odds?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Failed to fetch live odds");
      }

      setLiveOdds(data.odds || null);
      applyLiveOddsToForm(data.odds || null);
      setOddsNotice(data?.odds?.bookmaker ? `Live odds from ${data.odds.bookmaker}` : "Live odds loaded");
    } catch (err) {
      setLiveOdds(null);
      setOddsError(err instanceof Error ? err.message : "Unable to fetch live odds right now");
    } finally {
      setOddsLoading(false);
    }
  };

  // Fetch real fixtures from Football Data API
  useEffect(() => {
    async function loadFixtures() {
      if (!selectedLeague) return;
      
      setFixturesLoading(true);
      try {
        const response = await fetch(`/api/fixtures?league=${selectedLeague}&limit=50&days=7`);
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

  useEffect(() => {
    if (!liveOdds) return;
    const oddsForPick = pickOddsForSelection(formData.pick, liveOdds);
    if (!oddsForPick) return;
    const oddsString = oddsForPick.toString();

    if (formData.odds !== oddsString) {
      setFormData((prev) => ({
        ...prev,
        odds: oddsString,
        bookmaker: liveOdds.bookmaker || prev.bookmaker,
      }));
    }
  }, [formData.odds, formData.pick, liveOdds]);

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

    if (fixture.odds) {
      setLiveOdds({
        homeWin: fixture.odds.homeWin,
        draw: fixture.odds.draw,
        awayWin: fixture.odds.awayWin,
        bookmaker: "Football-Data",
        market: "h2h",
        source: "the-odds-api",
        lastUpdated: fixture.kickoff,
      });
      setOddsNotice("Using fixture odds");
    } else {
      setLiveOdds(null);
      setOddsNotice("");
    }

    setOddsError("");
    fetchLiveOddsForMatch(fixture.homeTeam, fixture.awayTeam);
  };

  const handleAddToSlip = () => {
    if (!formData.homeTeam || !formData.awayTeam || !formData.pick || !formData.odds) {
      setError("Please fill in all required fields");
      return;
    }

    if (!formData.kickoffTime) {
      setError("Kickoff time is required");
      return;
    }

    if (!formData.reasoning || formData.reasoning.trim().length < 10) {
      setError("Add at least 10 characters of reasoning");
      return;
    }

    const newItem: SlipItem = {
      id: `slip-${Date.now()}`,
      homeTeam: formData.homeTeam,
      awayTeam: formData.awayTeam,
      competition: formData.competition,
      kickoffTime: formData.kickoffTime,
      createdAt: new Date().toISOString(),
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
    setLiveOdds(null);
    setOddsNotice("");
    setOddsError("");
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

      if (!multiSlipMode) {
        if (!formData.homeTeam || !formData.awayTeam || !formData.pick || !formData.odds) {
          setError("Please select a match and fill in all fields");
          setLoading(false);
          return;
        }

        const oddsNumber = parseFloat(formData.odds);
        if (Number.isNaN(oddsNumber) || oddsNumber < 1.01) {
          setError("Odds must be at least 1.01");
          setLoading(false);
          return;
        }

        if (!formData.kickoffTime) {
          setError("Kickoff time is required");
          setLoading(false);
          return;
        }

        if (!formData.reasoning || formData.reasoning.trim().length < 10) {
          setError("Add at least 10 characters of reasoning");
          setLoading(false);
          return;
        }
      } else {
        const invalidSlip = slipItems.find((item) => {
          const oddsNumber = item.odds;
          return (
            !item.homeTeam ||
            !item.awayTeam ||
            !item.pick ||
            !oddsNumber ||
            oddsNumber < 1.01 ||
            !item.kickoffTime ||
            !item.reasoning || item.reasoning.trim().length < 10
          );
        });

        if (invalidSlip) {
          setError("Each slip pick needs teams, pick, odds ≥ 1.01, kickoff, and at least 10 chars of reasoning.");
          setLoading(false);
          return;
        }
      }

      const slipGroupId = multiSlipMode ? `slip-${Date.now()}` : undefined;

      const predictionsToSubmit = multiSlipMode 
        ? slipItems 
        : [formData];

      const createdIds: string[] = [];

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
            slipGroupId,
          }),
        });

        const responseData = await response.json();

        if (!response.ok) {
          const validationMessage = (responseData as any)?.details
            ? "Validation failed. Please check required fields."
            : (responseData as any)?.message || (responseData as any)?.error;
          throw new Error(validationMessage || "Failed to create prediction");
        }

        const idFromResponse = responseData?.prediction?.id;
        if (idFromResponse) {
          createdIds.push(idFromResponse);
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

      const targetPredictionId = createdIds[0];
      router.push(targetPredictionId ? `/predictions/${targetPredictionId}` : "/predictions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create prediction");
    } finally {
      setLoading(false);
    }
  };

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

      <div className="container-fluid section-spacing relative z-10">
        {/* Header */}
        <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 bg-white p-3 sm:p-6 rounded-lg sm:rounded-2xl shadow-lg border-2 border-gray-200">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-black mb-1 sm:mb-2">Make a Prediction</h1>
            <p className="text-xs sm:text-base text-gray-600">
              {multiSlipMode 
                ? `${slipItems.length} prediction${slipItems.length !== 1 ? 's' : ''} in slip`
                : "Single prediction mode"}
            </p>
          </div>
          <Link
            href="/predictions"
            className="px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base border-2 border-gray-300 text-black bg-white hover:bg-gray-50 transition-colors"
          >
            ← Back
          </Link>
        </div>

        {error && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-4 bg-red-100 border border-red-300 text-red-900 text-xs sm:text-sm rounded-lg shadow-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-4 bg-green-100 border border-green-300 text-green-900 text-xs sm:text-sm rounded-lg shadow-md">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white border-2 border-gray-200 rounded-lg sm:rounded-2xl p-3 sm:p-6 space-y-3 sm:space-y-4 shadow-lg">
              {/* Mode Toggle */}
              <div className="flex gap-2 sm:gap-4 mb-3 sm:mb-4">
                <button
                  type="button"
                  onClick={() => setMultiSlipMode(false)}
                  className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-4 rounded-lg font-semibold text-xs sm:text-base transition-colors border ${
                    !multiSlipMode
                      ? "bg-black text-white border-black"
                      : "bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  Single Prediction
                </button>
                <button
                  type="button"
                  onClick={() => setMultiSlipMode(true)}
                  className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-4 rounded-lg font-semibold text-xs sm:text-base transition-colors border ${
                    multiSlipMode
                      ? "bg-black text-white border-black"
                      : "bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  Multi-Pick Slip
                </button>
              </div>

              {/* League Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">Select League</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
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
                      className={`py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg font-semibold text-xs sm:text-sm transition-colors border ${
                        selectedLeague === slug
                          ? "bg-black text-white border-black"
                          : "bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100"
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
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Available Fixtures</label>
                  <div className="max-h-48 overflow-y-auto space-y-1 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    {fixtures.map((fixture, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleFixtureSelect(fixture)}
                        className="w-full text-left p-2 bg-white hover:bg-gray-50 rounded text-sm text-gray-900 border border-gray-200 transition-colors"
                      >
                        <span className="font-semibold">{fixture.homeTeam}</span> vs{" "}
                        <span className="font-semibold">{fixture.awayTeam}</span>
                        {fixture.kickoff && (
                          <span className="text-xs text-gray-500 ml-2">
                            {new Date(fixture.kickoff).toLocaleString()}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {fixturesLoading && <p className="text-sm text-gray-500 mt-1">Loading fixtures...</p>}
                </div>
              )}

              {/* Prediction Form */}
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Home Team"
                  value={formData.homeTeam}
                  onChange={(e) => setFormData({ ...formData, homeTeam: e.target.value })}
                  onBlur={() => {
                    if (formData.homeTeam && formData.awayTeam) {
                      fetchLiveOddsForMatch();
                    }
                  }}
                  className="col-span-2 sm:col-span-1 px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-900 placeholder-gray-500 focus:border-gray-300 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Away Team"
                  value={formData.awayTeam}
                  onChange={(e) => setFormData({ ...formData, awayTeam: e.target.value })}
                  onBlur={() => {
                    if (formData.homeTeam && formData.awayTeam) {
                      fetchLiveOddsForMatch();
                    }
                  }}
                  className="col-span-2 sm:col-span-1 px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-900 placeholder-gray-500 focus:border-gray-300 focus:outline-none"
                />

                <input
                  type="text"
                  placeholder="Competition"
                  value={formData.competition}
                  onChange={(e) => setFormData({ ...formData, competition: e.target.value })}
                  className="col-span-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-900 placeholder-gray-500 focus:border-gray-300 focus:outline-none"
                />

                <input
                  type="datetime-local"
                  value={formData.kickoffTime}
                  onChange={(e) => setFormData({ ...formData, kickoffTime: e.target.value })}
                  className="col-span-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-900 focus:border-gray-300 focus:outline-none"
                />

                <select
                  value={formData.market}
                  onChange={(e) => {
                    const newMarket = e.target.value as keyof typeof marketOptions;
                    setFormData({ ...formData, market: newMarket, pick: "" });
                    setSelectedMarket(newMarket);
                    // Refetch odds for new market
                    if (formData.homeTeam && formData.awayTeam) {
                      setTimeout(() => fetchLiveOddsForMatch(), 100);
                    }
                  }}
                  className="col-span-2 sm:col-span-1 px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-900 focus:border-gray-300 focus:outline-none"
                >
                  {Object.entries(marketOptions).map(([key, value]) => (
                    <option key={key} value={key}>
                      {marketLabels[key as keyof typeof marketLabels]}
                    </option>
                  ))}
                </select>

                <div className="col-span-2 sm:col-span-1 space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Bookmakers (Optional)</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3 max-h-32 overflow-y-auto space-y-1">
                    {["pinnacle", "bet365", "betfair", "draftkings", "fanduel", "caesars", "williamhill", "unibet_eu"].map((bm) => (
                      <label key={bm} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedBookmakers.includes(bm)}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...selectedBookmakers, bm]
                              : selectedBookmakers.filter(b => b !== bm);
                            setSelectedBookmakers(updated);
                            // Refetch odds with new bookmaker selection
                            if (formData.homeTeam && formData.awayTeam) {
                              setTimeout(() => fetchLiveOddsForMatch(), 100);
                            }
                          }}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-gray-700 capitalize">{bm.replace("_", " ")}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Leave empty for best available odds</p>
                </div>

                <select
                  value={formData.pick}
                  onChange={(e) => setFormData({ ...formData, pick: e.target.value })}
                  className="col-span-2 sm:col-span-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-gray-300 focus:outline-none"
                >
                  <option value="">Select Pick</option>
                  {formData.market && marketOptions[formData.market as keyof typeof marketOptions]?.map((option: any) => (
                    <option key={option.value || option} value={option.value || option}>
                      {option.label || option}
                    </option>
                  ))}
                </select>

                <div className="col-span-2 sm:col-span-1 space-y-1">
                  <input
                    type="number"
                    placeholder="Odds"
                    step="0.01"
                    value={formData.odds}
                    onChange={(e) => setFormData({ ...formData, odds: e.target.value })}
                    className="w-full px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-900 placeholder-gray-500 focus:border-gray-300 focus:outline-none"
                  />
                  {oddsLoading && (
                    <p className="text-xs text-gray-500 italic">Loading live odds...</p>
                  )}
                  {!oddsLoading && oddsNotice && (
                    <p className="text-xs text-green-600 italic">✓ {oddsNotice}</p>
                  )}
                  {!oddsLoading && oddsError && (
                    <p className="text-xs text-orange-600 italic">{oddsError}</p>
                  )}
                  {liveOdds && (
                    <div className="text-xs text-gray-600 flex gap-2 flex-wrap">
                      {formData.market === "1X2" && liveOdds.homeWin && liveOdds.draw && liveOdds.awayWin && (
                        <>
                          <span>H: {liveOdds.homeWin.toFixed(2)}</span>
                          <span>D: {liveOdds.draw.toFixed(2)}</span>
                          <span>A: {liveOdds.awayWin.toFixed(2)}</span>
                        </>
                      )}
                      {formData.market === "over-under" && liveOdds.over && liveOdds.under && (
                        <>
                          <span>Over: {liveOdds.over.toFixed(2)}</span>
                          <span>Under: {liveOdds.under.toFixed(2)}</span>
                        </>
                      )}
                      {formData.market === "btts" && liveOdds.btts_yes && liveOdds.btts_no && (
                        <>
                          <span>Yes: {liveOdds.btts_yes.toFixed(2)}</span>
                          <span>No: {liveOdds.btts_no.toFixed(2)}</span>
                        </>
                      )}
                      {liveOdds.bookmaker && (
                        <span className="text-gray-500">({liveOdds.bookmaker})</span>
                      )}
                    </div>
                  )}
                </div>

                {!multiSlipMode && (
                  <input
                    type="number"
                    placeholder="Stake"
                    step="0.01"
                    value={formData.stake}
                    onChange={(e) => setFormData({ ...formData, stake: e.target.value })}
                    className="col-span-2 sm:col-span-1 px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-900 placeholder-gray-500 focus:border-gray-300 focus:outline-none"
                  />
                )}

                <input
                  type="text"
                  placeholder="Bookmaker"
                  value={formData.bookmaker}
                  onChange={(e) => setFormData({ ...formData, bookmaker: e.target.value })}
                  className="col-span-2 sm:col-span-1 px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-900 placeholder-gray-500 focus:border-gray-300 focus:outline-none"
                />

                <textarea
                  placeholder="Your reasoning..."
                  value={formData.reasoning}
                  onChange={(e) => setFormData({ ...formData, reasoning: e.target.value })}
                  className="col-span-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-900 placeholder-gray-500 focus:border-gray-300 focus:outline-none h-16 sm:h-20 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 sm:pt-4">
                {multiSlipMode ? (
                  <>
                    <button
                      type="button"
                      onClick={handleAddToSlip}
                      disabled={loading}
                      className="flex-1 bg-black hover:bg-gray-900 disabled:bg-gray-700 text-white font-semibold py-1.5 sm:py-2 px-2 sm:px-4 text-sm sm:text-base rounded-lg transition-colors"
                    >
                      Add to Slip
                    </button>
                    <button
                      type="submit"
                      disabled={loading || slipItems.length === 0}
                      className="flex-1 bg-white border border-gray-900 text-gray-900 hover:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400 font-semibold py-1.5 sm:py-2 px-2 sm:px-4 text-sm sm:text-base rounded-lg transition-colors"
                    >
                      {loading ? "Submitting..." : `Submit Slip (${slipItems.length})`}
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black hover:bg-gray-900 disabled:bg-gray-700 text-white font-semibold py-1.5 sm:py-2 px-2 sm:px-4 text-sm sm:text-base rounded-lg transition-colors"
                  >
                    {loading ? "Submitting..." : "Make Prediction"}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Slip Sidebar */}
          {multiSlipMode && (
            <div className="bg-white border-2 border-gray-200 rounded-lg sm:rounded-2xl p-3 sm:p-6 h-fit sticky top-4 sm:top-8 shadow-lg">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Slip ({slipItems.length})</h2>

              {slipItems.length === 0 ? (
                <p className="text-gray-500 text-center py-6 sm:py-8 text-xs sm:text-sm">No predictions added yet</p>
              ) : (
                <>
                  <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto mb-3 sm:mb-4">
                    {slipItems.map((item, idx) => (
                      <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3">
                        <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                          <span className="text-xs font-semibold text-gray-800">Pick {idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromSlip(item.id)}
                            className="text-gray-500 hover:text-gray-900 text-xs sm:text-sm font-semibold"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-gray-900 font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1">
                          {item.homeTeam} vs {item.awayTeam}
                        </p>
                        <p className="text-xs text-gray-700 mb-0.5 sm:mb-1">
                          <span className="font-semibold">{item.pick}</span> @ {item.odds.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mb-0.5 sm:mb-1">
                          Added {new Date(item.createdAt).toLocaleString()}
                        </p>
                        {item.reasoning && (
                          <p className="text-xs text-gray-500 italic truncate">{item.reasoning}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-2 sm:pt-3">
                    <div className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3 space-y-1">
                      <div className="flex justify-between">
                        <span>Individual Odds:</span>
                        <span className="font-mono text-gray-900 text-xs">
                          {slipItems.map(item => item.odds.toFixed(2)).join(" × ")}
                        </span>
                      </div>
                      <div className="flex justify-between text-base sm:text-lg font-bold text-gray-900">
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
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 text-sm mb-2 focus:border-gray-300 focus:outline-none"
                    />
                    {formData.stake && (
                      <p className="text-xs text-gray-700">
                        Potential return: <span className="font-bold text-gray-900">
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
