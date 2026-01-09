"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { PredictionCard } from "./prediction-card";
import { PredictionsGridSkeleton } from "./predictions-grid-skeleton";
import { EmptyState } from "./empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Prediction {
  id: string;
  status: string;
  market: string;
  pick: string;
  odds: number | null;
  reasoning: string;
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

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/predictions?limit=20");
      
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

  const availableMarkets = useMemo(() => {
    const all = Array.from(new Set(predictions.map((p) => p.market).filter(Boolean)));
    return all.sort((a, b) => a.localeCompare(b));
  }, [predictions]);

  const filtered = predictions.filter((p) => {
    const matchesQuery = query
      ? `${p.market} ${p.pick} ${p.reasoning ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase())
      : true;
    const matchesStatus = status === "all" ? true : p.status === status;
    const matchesMarket = market === "all" ? true : p.market === market;
    return matchesQuery && matchesStatus && matchesMarket;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "processing": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

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
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by market, pick, or reasoning..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={market}
            onChange={(e) => setMarket(e.target.value)}
          >
            <option value="all">All markets</option>
            {availableMarkets.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        {(query || status !== "all" || market !== "all") && (
          <div className="sm:self-center">
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setStatus("all");
                setMarket("all");
              }}
              className="gap-1"
            >
              <X className="h-4 w-4" /> Clear
            </Button>
          </div>
        )}
      </div>

      {/* Active filter pills */}
      {(query || status !== "all" || market !== "all") && (
        <div className="flex flex-wrap gap-2">
          {query && (
            <Badge variant="secondary" className="gap-1 pl-2">
              Search: "{query}"
              <button onClick={() => setQuery("")}> <X className="h-3 w-3 ml-1" /> </button>
            </Badge>
          )}
          {status !== "all" && (
            <Badge variant="secondary" className="gap-1 pl-2">
              Status: {status}
              <button onClick={() => setStatus("all")}> <X className="h-3 w-3 ml-1" /> </button>
            </Badge>
          )}
          {market !== "all" && (
            <Badge variant="secondary" className="gap-1 pl-2">
              Market: {market}
              <button onClick={() => setMarket("all")}> <X className="h-3 w-3 ml-1" /> </button>
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
          <div className="text-sm text-gray-500">
            Showing {filtered.length} of {predictions.length}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <PredictionCard
                key={p.id}
                prediction={{
                  id: p.id,
                  market: p.market,
                  pick: p.pick,
                  odds: typeof p.odds === "number" ? p.odds : null,
                  status: (p.status as any) || "pending",
                  reasoning: p.reasoning,
                }}
                variant="compact"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
