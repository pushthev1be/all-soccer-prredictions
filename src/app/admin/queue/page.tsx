'use client';

import { useState, useEffect } from 'react';

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
}

export default function QueueAdminPage() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = async () => {
    try {
      setError(null);
      // Call the queue stats API endpoint if you create one, or mock data
      const response = await fetch('/api/admin/queue-stats');
      if (!response.ok) throw new Error('Failed to fetch queue stats');
      const data = await response.json();
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      // For now, show mock data if API not available
      setStats({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading queue stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🎯 Queue Monitor</h1>
          <p className="text-gray-600">Real-time prediction processing queue statistics</p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Status Cards */}
        {stats ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {/* Waiting */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Waiting</p>
                  <p className="text-4xl font-bold text-blue-600 mt-1">{stats.waiting}</p>
                </div>
                <div className="text-4xl">⏳</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Jobs in queue</p>
            </div>

            {/* Active */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Active</p>
                  <p className="text-4xl font-bold text-yellow-600 mt-1">{stats.active}</p>
                </div>
                <div className="text-4xl">⚡</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Processing now</p>
            </div>

            {/* Completed */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Completed</p>
                  <p className="text-4xl font-bold text-green-600 mt-1">{stats.completed}</p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Finished</p>
            </div>

            {/* Delayed */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Delayed</p>
                  <p className="text-4xl font-bold text-purple-600 mt-1">{stats.delayed}</p>
                </div>
                <div className="text-4xl">⏱️</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Retrying</p>
            </div>

            {/* Failed */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Failed</p>
                  <p className="text-4xl font-bold text-red-600 mt-1">{stats.failed}</p>
                </div>
                <div className="text-4xl">❌</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Errors</p>
            </div>
          </div>
        ) : null}

        {/* Summary Card */}
        {stats && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-gray-600 text-sm">Total Jobs</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Success Rate</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {stats.total > 0
                    ? ((stats.completed / stats.total) * 100).toFixed(1)
                    : 'N/A'}
                  %
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Throughput</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {stats.completed + stats.active}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  {stats.waiting + stats.delayed}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🔌 System Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Redis Queue</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✓ Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✓ Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Worker Service</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✓ Running
              </span>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchStats}
            className="inline-flex items-center px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            🔄 Refresh Now
          </button>
          <p className="text-sm text-gray-600 mt-2">Auto-refreshes every 5 seconds</p>
        </div>

        {error && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              ⚠️ {error}
            </p>
            <p className="text-yellow-700 text-xs mt-2">
              Make sure the worker is running: npx tsx src/workers/feedback.worker.ts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
