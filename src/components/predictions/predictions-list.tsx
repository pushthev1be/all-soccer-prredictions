"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { PredictionCard } from "./prediction-card";
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
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading predictions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Warning: {error}</div>
        <button
          onClick={fetchPredictions}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <div className="text-gray-500 mb-6">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium">No predictions yet</h3>
          <p className="mt-2">Create your first prediction to get AI feedback</p>
        </div>
        <Link
          href="/predictions/create"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
        >
          Create First Prediction
        </Link>
      </div>
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
    </div>
  );
}
