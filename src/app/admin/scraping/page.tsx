'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
  total: number;
  upcoming: number;
  byCompetition: Array<{ competition: string; count: number }>;
}

export default function ScrapingAdminPage() {
  const [status, setStatus] = useState<string>('');
  const [isScraping, setIsScraping] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedLeague, setSelectedLeague] = useState('premier-league');

  const leagues = [
    { id: 'premier-league', name: 'Premier League' },
    { id: 'la-liga', name: 'La Liga' },
    { id: 'bundesliga', name: 'Bundesliga' },
    { id: 'serie-a', name: 'Serie A' },
    { id: 'ligue-1', name: 'Ligue 1' },
    { id: 'champions-league', name: 'Champions League' },
  ];

  useEffect(() => {
    loadStats();
    
    // Auto-refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/scrape?action=stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const startScrapingAll = async () => {
    setIsScraping(true);
    setStatus('🔄 Starting full scrape of all leagues...');
    
    try {
      const response = await fetch('/api/scrape?action=force');
      const data = await response.json();
      
      if (data.success) {
        setStatus(`✅ ${data.message}`);
        await loadStats();
      } else {
        setStatus(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      setStatus(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsScraping(false);
    }
  };

  const scrapeSingleLeague = async () => {
    setIsScraping(true);
    setStatus(`🔄 Scraping ${selectedLeague}...`);
    
    try {
      const response = await fetch(`/api/scrape?league=${selectedLeague}`);
      const data = await response.json();
      
      if (data.success) {
        setStatus(`✅ ${data.message}`);
        await loadStats();
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setStatus(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsScraping(false);
    }
  };

  const cleanOldFixtures = async () => {
    setStatus('🗑️  Cleaning old fixtures...');
    
    try {
      const response = await fetch('/api/scrape?action=clean');
      const data = await response.json();
      
      if (data.success) {
        setStatus(`✅ ${data.message}`);
        await loadStats();
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setStatus(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const startService = async () => {
    setStatus('🚀 Starting scraping service...');
    
    try {
      const response = await fetch('/api/scrape/start');
      const data = await response.json();
      
      if (data.success) {
        setStatus(`✅ ${data.message}`);
      } else {
        setStatus(`❌ ${data.error}`);
      }
    } catch (error) {
      setStatus(`❌ Failed to start service`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Web Scraping Admin</h1>
          <p className="text-gray-600 mt-2">Manage real-time fixture data scraping from BBC Sport and other sources</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
              <div className="text-sm text-gray-600 mb-1">Total Fixtures</div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
              <div className="text-sm text-gray-600 mb-1">Upcoming</div>
              <div className="text-3xl font-bold text-gray-900">{stats.upcoming}</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
              <div className="text-sm text-gray-600 mb-1">Competitions</div>
              <div className="text-3xl font-bold text-gray-900">{stats.byCompetition.length}</div>
            </div>
          </div>
        )}

        {/* Manual Control */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">Manual Control</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={startScrapingAll}
              disabled={isScraping}
              className="px-6 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isScraping ? '🔄 Scraping All Leagues...' : '🚀 Force Scrape All Leagues'}
            </button>
            
            <button
              onClick={startService}
              className="px-6 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              🏁 Start Scheduled Service (6h)
            </button>
          </div>

          {/* Single League Scrape */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Scrape Single League:</label>
            <div className="flex gap-3">
              <select
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {leagues.map(league => (
                  <option key={league.id} value={league.id}>{league.name}</option>
                ))}
              </select>
              <button
                onClick={scrapeSingleLeague}
                disabled={isScraping}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Scrape
              </button>
            </div>
          </div>

          {/* Maintenance */}
          <div className="border-t pt-4 mt-4">
            <button
              onClick={cleanOldFixtures}
              className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              🗑️ Clean Old Fixtures
            </button>
          </div>
          
          {status && (
            <div className={`mt-4 p-4 rounded-lg ${
              status.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' :
              status.includes('❌') ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              <p className="font-mono text-sm">{status}</p>
            </div>
          )}
        </div>

        {/* Fixtures by Competition */}
        {stats && stats.byCompetition.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Fixtures by Competition</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.byCompetition.map((comp, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">{comp.competition}</span>
                  <span className="text-2xl font-bold text-blue-600">{comp.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scraping Sources */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">Scraping Sources</h2>
          <ul className="space-y-3">
            <li className="flex items-center p-3 bg-green-50 rounded-lg">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
              <div>
                <div className="font-semibold text-gray-900">BBC Sport - Primary Source</div>
                <div className="text-sm text-gray-600">Premier League, Champions League, La Liga, Bundesliga, Serie A, Ligue 1</div>
              </div>
            </li>
            <li className="flex items-center p-3 bg-yellow-50 rounded-lg">
              <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
              <div>
                <div className="font-semibold text-gray-900">ESPN - Backup Source (Coming Soon)</div>
                <div className="text-sm text-gray-600">All major competitions</div>
              </div>
            </li>
            <li className="flex items-center p-3 bg-blue-50 rounded-lg">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
              <div>
                <div className="font-semibold text-gray-900">SofaScore - Statistics (Planned)</div>
                <div className="text-sm text-gray-600">Detailed match statistics and live scores</div>
              </div>
            </li>
          </ul>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">How It Works:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>Scraper fetches data from BBC Sport every 6 hours</li>
              <li>Fixtures are validated and deduplicated</li>
              <li>New fixtures are stored in the database</li>
              <li>Your app uses real scraped data automatically</li>
              <li>Old fixtures (7+ days) are cleaned up periodically</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
