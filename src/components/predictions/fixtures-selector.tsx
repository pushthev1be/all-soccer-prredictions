'use client';
import { useEffect, useState } from "react";
import { Calendar, MapPin, RefreshCw } from "lucide-react";

interface Fixture {
  id: string;
  competition: string;
  canonicalCompetitionId: string;
  homeTeam: string;
  awayTeam: string;
  canonicalHomeTeamId: string;
  canonicalAwayTeamId: string;
  kickoffTimeUTC: string;
  venue?: string;
}

interface FixturesSelectorProps {
  value?: string;
  onSelect: (fixture: Fixture) => void;
  className?: string;
}

export function FixturesSelector({ value, onSelect, className = "" }: FixturesSelectorProps) {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/fixtures");
        if (!res.ok) throw new Error("Failed to fetch fixtures");
        const data = await res.json();
        setFixtures(data.fixtures || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load fixtures");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatTime = (iso: string) => new Date(iso).toLocaleString();

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Pick from suggested fixtures</h3>
        {loading && <span className="text-xs text-gray-500">Loading...</span>}
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1 rounded border border-yellow-400 px-2 py-1 text-xs font-semibold hover:bg-yellow-100"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {fixtures.map((fixture) => {
          const selected = value === fixture.id;
          return (
            <button
              key={fixture.id}
              type="button"
              onClick={() => onSelect(fixture)}
              className={`w-full rounded-lg border p-4 text-left transition ${
                selected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase text-gray-500">{fixture.competition}</div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>{formatTime(fixture.kickoffTimeUTC)}</span>
                </div>
              </div>

              <div className="mt-2 text-lg font-semibold text-gray-900">
                {fixture.homeTeam} vs {fixture.awayTeam}
              </div>

              {fixture.venue && (
                <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  <span>{fixture.venue}</span>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-600">Tap to auto-fill teams and competition</div>
            </button>
          );
        })}

        {!loading && fixtures.length === 0 && !error && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
            No fixtures available right now.
          </div>
        )}
      </div>
    </div>
  );
}
