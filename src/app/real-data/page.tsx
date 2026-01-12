'use client';

import { useEffect, useState } from 'react';
import { realFootballData } from '@/lib/api/real-football-data';

interface Standing {
  position: number;
  team: {
    id: number;
    name: string;
    shortName: string;
    crest: string;
  };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form?: string;
}

interface Fixture {
  id: number;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  utcDate: string;
  competition: { name: string };
  status: string;
}

export default function RealDataPage() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [standingsData, fixturesData] = await Promise.all([
          realFootballData.getPremierLeagueStandings(),
          realFootballData.getUpcomingFixtures('PL', 10),
        ]);
        setStandings(standingsData);
        setFixtures(fixturesData);
        setError(null);
      } catch (err) {
        console.error('Failed to load real data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Loading real football data...</div>
          <div className="text-sm text-gray-600">Fetching from Football-Data.org</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="font-semibold text-red-800 mb-2">❌ Error Loading Data</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="text-sm text-red-600">
            <p>• Check if API key is set in .env.local</p>
            <p>• Verify FOOTBALL_DATA_API_KEY is valid</p>
            <p>• Check rate limits (10 requests/min)</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-black text-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">⚽ 100% Real Football Data</h1>
        <p className="text-gray-400 mb-8">Live statistics from Football-Data.org • Zero mock data</p>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Premier League Standings */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-2xl font-bold mb-6">Premier League Table</h2>
            <div className="space-y-2">
              {standings.slice(0, 10).map(team => (
                <div 
                  key={team.team.id} 
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="font-bold text-yellow-400 w-6 text-center">{team.position}</span>
                    <div className="flex-1">
                      <div className="font-semibold">{team.team.name}</div>
                      <div className="text-xs text-gray-400">{team.form}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">{team.points} pts</div>
                    <div className="text-xs text-gray-400">
                      {team.won}W {team.draw}D {team.lost}L
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-gray-800 rounded-lg text-sm text-gray-300">
              <span className="font-semibold">{standings.length}</span> teams • Real stats • Live updates
            </div>
          </div>

          {/* Upcoming Fixtures */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-2xl font-bold mb-6">Upcoming Fixtures</h2>
            <div className="space-y-3">
              {fixtures.map((fixture, idx) => (
                <div 
                  key={fixture.id || idx} 
                  className="p-4 border border-gray-700 rounded-lg hover:border-gray-600 transition"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{fixture.homeTeam.name}</span>
                    <span className="text-gray-500 text-sm">vs</span>
                    <span className="font-semibold">{fixture.awayTeam.name}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(fixture.utcDate).toLocaleDateString()} at {new Date(fixture.utcDate).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{fixture.competition.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
            <div className="text-green-400 font-semibold mb-1">✅ Data Source</div>
            <div className="text-sm text-gray-300">Football-Data.org v4 API</div>
          </div>
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <div className="text-blue-400 font-semibold mb-1">📊 Coverage</div>
            <div className="text-sm text-gray-300">6 Major European Leagues</div>
          </div>
          <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
            <div className="text-purple-400 font-semibold mb-1">🔄 Updates</div>
            <div className="text-sm text-gray-300">Live • Real-time stats</div>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="font-bold text-lg mb-4">What's Real Here?</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <div className="font-semibold text-white mb-2">✅ Real Data</div>
              <ul className="text-gray-400 space-y-1">
                <li>• League standings & points</li>
                <li>• Team form & recent results</li>
                <li>• Goals for/against statistics</li>
                <li>• Head-to-head history</li>
                <li>• Upcoming fixtures & dates</li>
                <li>• Team crests & logos</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-white mb-2">🤖 AI-Enhanced</div>
              <ul className="text-gray-400 space-y-1">
                <li>• Intelligent predictions</li>
                <li>• Match analysis</li>
                <li>• Odds calculations</li>
                <li>• Team comparisons</li>
                <li>• Tactical insights</li>
                <li>• OpenRouter (Llama 3.1 70B)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
          <div className="text-yellow-400 font-semibold mb-1">🚀 No More Mock Data</div>
          <p className="text-gray-300 text-sm">
            All statistics, standings, and team data are now 100% real from Football-Data.org. 
            No simulated or fictional data is being used anywhere in the system.
          </p>
        </div>
      </div>
    </div>
  );
}
