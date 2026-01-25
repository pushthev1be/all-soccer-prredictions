'use client';

import { useEffect, useState, useRef } from 'react';
import { TeamBadge } from '@/components/team/team-badge';

interface LiveMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  minute: string | null;
  competition: string;
  startTime: string;
}

interface LiveScoresData {
  matches: LiveMatch[];
  lastUpdated: string;
  source: string;
}

export function LiveScores() {
  const [data, setData] = useState<LiveScoresData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchScores() {
      try {
        const response = await fetch('/api/live-scores');
        if (!response.ok) throw new Error('Failed to fetch');
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError('Unable to load live scores');
        console.error('Live scores error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchScores();
    // Refresh every 60 seconds
    const interval = setInterval(fetchScores, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full bg-black/90 backdrop-blur-sm border-b-2 border-white/20">
        <div className="container-fluid py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white text-xs font-bold uppercase tracking-wider">Live</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex gap-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex-shrink-0 bg-white/10 rounded-lg h-12 w-48" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data || data.matches.length === 0) {
    return null; // Don't show anything if no matches
  }

  const getStatusColor = (status: string) => {
    if (status === 'Live' || status === 'HT') return 'bg-red-500';
    if (status === 'FT') return 'bg-gray-500';
    return 'bg-green-500';
  };

  const getStatusText = (match: LiveMatch) => {
    if (match.minute) return `${match.minute}'`;
    return match.status;
  };

  return (
    <div className="w-full bg-black/90 backdrop-blur-sm border-b-2 border-white/20">
      <div className="container-fluid py-2 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live indicator */}
          <div className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 pr-2 sm:pr-3 border-r border-white/20">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider">Live</span>
          </div>

          {/* Scrollable matches */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex gap-2 sm:gap-3">
              {data.matches.map((match) => (
                <div
                  key={match.id}
                  className="flex-shrink-0 bg-white/10 hover:bg-white/15 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Home team */}
                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                      <TeamBadge teamName={match.homeTeam} size="sm" />
                      <span className="text-white text-[10px] sm:text-xs font-medium truncate max-w-[50px] sm:max-w-[70px]">
                        {match.homeTeam.split(' ').pop()}
                      </span>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      {match.homeScore !== null && match.awayScore !== null ? (
                        <>
                          <span className="text-white font-bold text-xs sm:text-sm min-w-[14px] text-center">
                            {match.homeScore}
                          </span>
                          <span className="text-white/50 text-[10px] sm:text-xs">-</span>
                          <span className="text-white font-bold text-xs sm:text-sm min-w-[14px] text-center">
                            {match.awayScore}
                          </span>
                        </>
                      ) : (
                        <span className="text-white/70 text-[10px] sm:text-xs font-medium">vs</span>
                      )}
                    </div>

                    {/* Away team */}
                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                      <span className="text-white text-[10px] sm:text-xs font-medium truncate max-w-[50px] sm:max-w-[70px]">
                        {match.awayTeam.split(' ').pop()}
                      </span>
                      <TeamBadge teamName={match.awayTeam} size="sm" />
                    </div>

                    {/* Status badge */}
                    <div className={`${getStatusColor(match.status)} px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[10px] font-bold text-white uppercase`}>
                      {getStatusText(match)}
                    </div>
                  </div>

                  {/* Competition name */}
                  <div className="text-white/50 text-[8px] sm:text-[10px] mt-0.5 sm:mt-1 truncate max-w-[180px] sm:max-w-[220px]">
                    {match.competition}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
