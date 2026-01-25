"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { PredictionCard } from "./prediction-card";
import { PredictionsGridSkeleton } from "./predictions-grid-skeleton";
import { EmptyState } from "./empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { competitionNameFromCanonical, teamNameFromCanonical } from "@/lib/competitions";
import { X } from "lucide-react";

interface Prediction {
  id: string;
  status: string;
  market: string;
  pick: string;
  odds: number | null;
  stake?: number | null;
  reasoning: string;
  competition?: string | null;
  canonicalCompetitionId?: string | null;
  canonicalHomeTeamId?: string | null;
  canonicalAwayTeamId?: string | null;
  kickoffTimeUTC?: string | null;
  createdAt: string;
  feedback: {
    id: string;
    summary: string;
    confidenceScore: number;
    createdAt: string;
  } | null;
}

interface PredictionsListProps {
  userId: string;
}

export default function PredictionsList({ userId }: PredictionsListProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [market, setMarket] = useState<string>("all");
  const [competition, setCompetition] = useState<string>("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/predictions?limit=100");
      
      if (!response.ok) {
        throw new Error("Failed to fetch predictions");
      }
      
      const data = await response.json();
      setPredictions(data.predictions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load predictions");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (predictionId: string) => {
    if (!confirm("Are you sure you want to delete this prediction? This action cannot be undone.")) {
      return;
    }

    try {
      setDeleting(predictionId);
      console.log("Deleting prediction:", predictionId);
      
      const response = await fetch(`/api/predictions/${predictionId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      console.log("Delete response:", response.status, data);

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to delete prediction");
      }

      // Remove from local state
      setPredictions((prev) => prev.filter((p) => p.id !== predictionId));
      console.log("Prediction deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      alert(err instanceof Error ? err.message : "Failed to delete prediction");
    } finally {
      setDeleting(null);
    }
  };

  const getCompetitionLabel = (prediction: Prediction) => {
    return prediction.competition || competitionNameFromCanonical(prediction.canonicalCompetitionId) || null;
  };

  const stats = useMemo(() => {
    const total = predictions.length;
    const completed = predictions.filter((p) => p.status === "completed").length;
    const pending = predictions.filter((p) => p.status === "pending").length;
    const processing = predictions.filter((p) => p.status === "processing").length;
    return { total, completed, pending, processing };
  }, [predictions]);

  const availableMarkets = useMemo(() => {
    const all = Array.from(new Set(predictions.map((p) => p.market).filter(Boolean)));
    return all.sort((a, b) => a.localeCompare(b));
  }, [predictions]);

  const availableCompetitions = useMemo(() => {
    const labels = predictions
      .map((p) => getCompetitionLabel(p))
      .filter((label): label is string => Boolean(label));
    return Array.from(new Set(labels)).sort((a, b) => a.localeCompare(b));
  }, [predictions]);

  const filtered = predictions.filter((p) => {
    const matchesQuery = query
      ? `${p.market} ${p.pick} ${p.reasoning ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase())
      : true;
    const matchesStatus = status === "all" ? true : p.status === status;
    const matchesMarket = market === "all" ? true : p.market === market;
    const matchesCompetition = competition === "all" ? true : getCompetitionLabel(p) === competition;
    return matchesQuery && matchesStatus && matchesMarket && matchesCompetition;
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed": return "Ready";
      case "processing": return "Analyzing";
      case "failed": return "Failed";
      default: return "Pending";
    }
  };

  if (loading) {
    return <PredictionsGridSkeleton />;
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to Load Predictions"
        description={error}
        actionLabel="Try Again"
        onAction={fetchPredictions}
        type="error"
      />
    );
  }

  if (predictions.length === 0) {
    return (
      <EmptyState
        title="No Predictions Yet"
        description="Create your first prediction to get AI feedback on potential outcomes and strategic insights."
        actionLabel="Create First Prediction"
        onAction={() => (window.location.href = "/predictions/create")}
        type="no-data"
      />
    );
  }

  return (
    <div className="rounded-2xl border-2 border-black bg-white p-4 sm:p-6 space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-white border-2 border-black">
          <p className="text-sm text-gray-700 mb-1">Total</p>
          <p className="text-2xl font-bold text-black">{stats.total}</p>
        </div>
        <div className="p-4 rounded-lg bg-white border-2 border-black">
          <p className="text-sm text-gray-700 mb-1">Completed</p>
          <p className="text-2xl font-bold text-black">{stats.completed}</p>
        </div>
        <div className="p-4 rounded-lg bg-white border-2 border-black">
          <p className="text-sm text-gray-700 mb-1">Pending</p>
          <p className="text-2xl font-bold text-black">{stats.pending}</p>
        </div>
        <div className="p-4 rounded-lg bg-white border-2 border-black">
          <p className="text-sm text-gray-700 mb-1">Processing</p>
          <p className="text-2xl font-bold text-black">{stats.processing}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row items-stretch gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by market, pick, or reasoning..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            className="h-10 rounded-md border-2 border-black bg-white px-3 py-2 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <select
            className="h-10 rounded-md border-2 border-black bg-white px-3 py-2 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
            value={market}
            onChange={(e) => setMarket(e.target.value)}
          >
            <option value="all">All markets</option>
            {availableMarkets.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border-2 border-black bg-white px-3 py-2 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
            value={competition}
            onChange={(e) => setCompetition(e.target.value)}
          >
            <option value="all">All competitions</option>
            {availableCompetitions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        {(query || status !== "all" || market !== "all" || competition !== "all") && (
          <div className="sm:self-center">
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setStatus("all");
                setMarket("all");
                setCompetition("all");
              }}
              className="gap-1 border-2 border-black text-black hover:bg-gray-100"
            >
              <X className="h-4 w-4" /> Clear
            </Button>
          </div>
        )}
      </div>

      {/* Active filter pills */}
      {(query || status !== "all" || market !== "all" || competition !== "all") && (
        <div className="flex flex-wrap gap-2">
          {query && (
            <Badge variant="outline" className="gap-1 pl-2 border-black text-black bg-white">
              Search: "{query}"
              <button onClick={() => setQuery("")}> <X className="h-3 w-3 ml-1" /> </button>
            </Badge>
          )}
          {status !== "all" && (
            <Badge variant="outline" className="gap-1 pl-2 border-black text-black bg-white">
              Status: {status}
              <button onClick={() => setStatus("all")}> <X className="h-3 w-3 ml-1" /> </button>
            </Badge>
          )}
          {market !== "all" && (
            <Badge variant="outline" className="gap-1 pl-2 border-black text-black bg-white">
              Market: {market}
              <button onClick={() => setMarket("all")}> <X className="h-3 w-3 ml-1" /> </button>
            </Badge>
          )}
          {competition !== "all" && (
            <Badge variant="outline" className="gap-1 pl-2 border-black text-black bg-white">
              Competition: {competition}
              <button onClick={() => setCompetition("all")}> <X className="h-3 w-3 ml-1" /> </button>
            </Badge>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title="No Predictions Match"
          description="Try adjusting your filters or search query to find predictions."
          type="no-results"
        />
      ) : (
        <>
          <div className="text-sm text-gray-700">
            Showing {filtered.length} of {predictions.length}
          </div>

          <div className="grid gap-4">
            {filtered.map((p) => {
              const competitionLabel = getCompetitionLabel(p) || undefined;
              const homeTeam = teamNameFromCanonical(p.canonicalHomeTeamId) || undefined;
              const awayTeam = teamNameFromCanonical(p.canonicalAwayTeamId) || undefined;

              return (
                <div key={p.id} className="relative group">
                  <PredictionCard
                    prediction={{
                      id: p.id,
                      homeTeam,
                      awayTeam,
                      competition: competitionLabel,
                      market: p.market,
                      pick: p.pick,
                      odds: typeof p.odds === "number" ? p.odds : null,
                      stake: typeof p.stake === "number" ? p.stake : undefined,
                      status: (p.status as any) || "pending",
                      reasoning: p.reasoning,
                      startTime: p.kickoffTimeUTC || undefined,
                    }}
                    variant="compact"
                  />
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deleting === p.id}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black hover:bg-gray-900 text-white p-2 rounded-lg shadow-lg disabled:opacity-50"
                    title="Delete prediction"
                  >
                    {deleting === p.id ? (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
