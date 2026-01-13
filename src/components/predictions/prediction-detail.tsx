'use client';

import { Prediction, Feedback } from '@prisma/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { TeamBadge } from '@/components/team/team-badge';

interface PredictionWithFeedback extends Prediction {
  feedback: Feedback | null;
  user: {
    name: string | null;
    email: string;
  };
}

interface PredictionDetailProps {
  prediction: PredictionWithFeedback;
}

export default function PredictionDetail({ prediction: initialPrediction }: PredictionDetailProps) {
  const router = useRouter();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [prediction, setPrediction] = useState(initialPrediction);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Client-side polling for real-time feedback updates
  useEffect(() => {
    if (!prediction.feedback && autoRefresh) {
      let isMounted = true;
      
      const pollFeedback = async () => {
        try {
          setIsRefreshing(true);
          const response = await fetch(`/api/predictions/${prediction.id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (!response.ok) throw new Error('Failed to fetch prediction');
          
          const updatedPrediction = await response.json();
          if (isMounted) {
            setPrediction(updatedPrediction);
            // Stop polling once feedback is available
            if (updatedPrediction.feedback) {
              setAutoRefresh(false);
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
        } finally {
          if (isMounted) {
            setIsRefreshing(false);
          }
        }
      };

      // Poll every 2 seconds for live updates
      const interval = setInterval(pollFeedback, 2000);
      
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }
  }, [prediction.id, autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Ready';
      case 'processing':
        return 'Analyzing';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-white min-h-screen">
      <Link
        href="/predictions"
        className="inline-flex items-center text-blue-600 hover:text-blue-900 mb-6"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Predictions
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Match Info Card */}
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold">
                  {prediction.canonicalHomeTeamId
                    .replace('custom:', '')
                    .replace(/-/g, ' ')}{' '}
                  vs{' '}
                  {prediction.canonicalAwayTeamId
                    .replace('custom:', '')
                    .replace(/-/g, ' ')}
                </h1>
                <p className="text-gray-600 mt-2">
                  {prediction.canonicalCompetitionId
                    .replace('custom:', '')
                    .replace(/-/g, ' ')}
                </p>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                  prediction.status
                )}`}
              >
                {getStatusLabel(prediction.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-sm font-medium text-gray-600">Market</p>
                <p className="text-lg font-semibold">{prediction.market}</p>
              </div>
              <div className="border-l-4 border-green-600 pl-4">
                <p className="text-sm font-medium text-gray-600">Pick</p>
                <p className="text-lg font-semibold">{prediction.pick}</p>
              </div>
              <div className="border-l-4 border-purple-600 pl-4">
                <p className="text-sm font-medium text-gray-600">Odds</p>
                <p className="text-lg font-semibold">{prediction.odds || 'N/A'}</p>
              </div>
              <div className="border-l-4 border-orange-600 pl-4">
                <p className="text-sm font-medium text-gray-600">Stake</p>
                <p className="text-lg font-semibold">{prediction.stake || 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Kickoff Time (UTC)</h3>
                <p className="text-gray-700">
                  {formatDate(prediction.kickoffTimeUTC)}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Your Reasoning</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded">
                  {prediction.reasoning}
                </p>
              </div>

              {prediction.bookmaker && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Bookmaker</h3>
                  <p className="text-gray-700">{prediction.bookmaker}</p>
                </div>
              )}
            </div>
          </div>

          {/* Feedback Section */}
          {prediction.feedback ? (
            <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-black via-gray-900 to-black p-6 shadow-xl border-b border-white/20">
                <h2 className="text-3xl font-black text-white drop-shadow-sm">AI Feedback & Analysis</h2>
              </div>

              <div className="p-6 space-y-8">
                {/* Split Team Box with Form and Verdict - BLACK & WHITE DESIGN */}
                <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-2xl border-4 border-white p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_left,_#ffffff,_transparent_40%),_radial-gradient(circle_at_bottom_right,_#ffffff,_transparent_35%)]" aria-hidden="true"></div>
                  <div className="relative grid grid-cols-2 gap-6">
                    {/* Home Team */}
                    <div className="flex flex-col items-center justify-center border-r-2 border-gray-700 pr-6">
                      <div className="mb-4">
                        <TeamBadge
                          teamName={prediction.canonicalHomeTeamId.replace('custom:', '').replace(/-/g, ' ')}
                          size="xl"
                        />
                      </div>
                      <h3 className="text-3xl font-black text-white text-center mb-4 tracking-tight">
                        {prediction.canonicalHomeTeamId.replace('custom:', '').replace(/-/g, ' ')}
                      </h3>
                      <div className="bg-white rounded-lg p-5 w-full shadow-lg border-2 border-black">
                        <p className="text-xs text-black font-black mb-2 text-center uppercase tracking-widest">Form</p>
                        <p className="text-3xl font-black text-black text-center tracking-widest">
                          {(prediction.feedback as any).formAnalysis?.homeRecentForm || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col items-center justify-center border-l-2 border-gray-700 pl-6">
                      <div className="mb-4">
                        <TeamBadge
                          teamName={prediction.canonicalAwayTeamId.replace('custom:', '').replace(/-/g, ' ')}
                          size="xl"
                        />
                      </div>
                      <h3 className="text-3xl font-black text-white text-center mb-4 tracking-tight">
                        {prediction.canonicalAwayTeamId.replace('custom:', '').replace(/-/g, ' ')}
                      </h3>
                      <div className="bg-white rounded-lg p-5 w-full shadow-lg border-2 border-black">
                        <p className="text-xs text-black font-black mb-2 text-center uppercase tracking-widest">Form</p>
                        <p className="text-3xl font-black text-black text-center tracking-widest">
                          {(prediction.feedback as any).formAnalysis?.awayRecentForm || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Final Verdict */}
                  <div className="mt-8 pt-8 border-t-2 border-gray-600">
                    <p className="text-sm font-black text-gray-400 mb-3 uppercase tracking-widest">📌 Final Verdict</p>
                    <p className="text-xl text-white font-semibold leading-relaxed">
                      {prediction.feedback.summary || 'No verdict available'}
                    </p>
                  </div>
                </div>

                {/* Confidence Score Banner */}
                <div className={`p-6 rounded-lg bg-white shadow-md ${
                  prediction.feedback.confidenceScore > 0.7
                    ? 'bg-green-50 border-l-4 border-green-600'
                    : prediction.feedback.confidenceScore > 0.5
                    ? 'bg-yellow-50 border-l-4 border-yellow-600'
                    : 'bg-red-50 border-l-4 border-red-600'
                }`}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold">Confidence Score</h3>
                    <span className="text-3xl font-bold text-blue-600">
                      {(prediction.feedback.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        prediction.feedback.confidenceScore > 0.7
                          ? 'bg-green-500'
                          : prediction.feedback.confidenceScore > 0.5
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${prediction.feedback.confidenceScore * 100}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-700">
                    {prediction.feedback.confidenceExplanation}
                  </p>
                </div>

                {/* CRITICAL STATS - Two Row Comparison */}
                {(prediction.feedback as any).teamComparison && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
                    <h3 className="text-lg font-bold text-purple-700 mb-4 flex items-center gap-2">
                      <span>📊</span> CRITICAL MATCH STATS
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-purple-100 border-b-2 border-purple-300">
                            <th className="text-left p-3 font-bold text-purple-800">Team</th>
                            <th className="text-left p-3 font-bold text-purple-800">Ranking</th>
                            <th className="text-left p-3 font-bold text-purple-800">Season Form</th>
                            <th className="text-left p-3 font-bold text-purple-800">Recent</th>
                            <th className="text-left p-3 font-bold text-purple-800">Head-to-Head</th>
                            <th className="text-left p-3 font-bold text-purple-800">Injuries</th>
                            <th className="text-left p-3 font-bold text-purple-800">Twitter Buzz</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Home Team Row */}
                          <tr className="border-b border-purple-200 bg-white hover:bg-purple-50">
                            <td className="p-3 font-bold text-gray-900">{(prediction.feedback as any).teamComparison.home.name}</td>
                            <td className="p-3 text-gray-700">{(prediction.feedback as any).teamComparison.home.ranking}</td>
                            <td className="p-3 text-gray-700">{(prediction.feedback as any).teamComparison.home.seasonForm}</td>
                            <td className="p-3 text-gray-700 font-mono text-xs">{(prediction.feedback as any).teamComparison.home.recentForm}</td>
                            <td className="p-3 text-gray-700">{(prediction.feedback as any).teamComparison.home.headToHead}</td>
                            <td className="p-3 text-gray-700">{(prediction.feedback as any).teamComparison.home.injuries}</td>
                            <td className="p-3 text-gray-600 text-xs italic">{(prediction.feedback as any).teamComparison.home.twitterBuzz}</td>
                          </tr>
                          {/* Away Team Row */}
                          <tr className="bg-white hover:bg-purple-50">
                            <td className="p-3 font-bold text-gray-900">{(prediction.feedback as any).teamComparison.away.name}</td>
                            <td className="p-3 text-gray-700">{(prediction.feedback as any).teamComparison.away.ranking}</td>
                            <td className="p-3 text-gray-700">{(prediction.feedback as any).teamComparison.away.seasonForm}</td>
                            <td className="p-3 text-gray-700 font-mono text-xs">{(prediction.feedback as any).teamComparison.away.recentForm}</td>
                            <td className="p-3 text-gray-700">{(prediction.feedback as any).teamComparison.away.headToHead}</td>
                            <td className="p-3 text-gray-700">{(prediction.feedback as any).teamComparison.away.injuries}</td>
                            <td className="p-3 text-gray-600 text-xs italic">{(prediction.feedback as any).teamComparison.away.twitterBuzz}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Market Odds - Keep this separate for clarity */}
                <div className="grid grid-cols-1 gap-6">

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-l-4 border-green-600 shadow-lg">
                    <h4 className="font-bold text-green-700 mb-4 text-lg">💰 Market Odds & Value</h4>
                    {(prediction.feedback as any).marketInsight ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="text-xs text-gray-500 mb-1">Home Win</div>
                            <div className="text-2xl font-bold text-green-700">{(prediction.feedback as any).marketInsight.odds.homeWin?.toFixed(2)}</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="text-xs text-gray-500 mb-1">Draw</div>
                            <div className="text-2xl font-bold text-green-700">{(prediction.feedback as any).marketInsight.odds.draw?.toFixed(2)}</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="text-xs text-gray-500 mb-1">Away Win</div>
                            <div className="text-2xl font-bold text-green-700">{(prediction.feedback as any).marketInsight.odds.awayWin?.toFixed(2)}</div>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-600 mb-2">Implied Probabilities:</p>
                          <p className="text-sm font-semibold text-gray-800">{(prediction.feedback as any).marketInsight.impliedProbability}</p>
                        </div>
                        {(prediction.feedback as any).marketInsight.valueAssessment && (
                          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3 rounded">
                            <p className="text-sm font-bold text-yellow-800">{(prediction.feedback as any).marketInsight.valueAssessment}</p>
                          </div>
                        )}
                      </div>
                    ) : <p className="text-gray-600">No odds data</p>}
                  </div>
                </div>

                {/* Strengths & Risks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-green-600 mb-3 flex items-center gap-2">
                      <span>✅</span> Strengths
                    </h3>
                    <ul className="space-y-2">
                      {prediction.feedback.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start text-gray-700 text-sm">
                          <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-red-600 mb-3 flex items-center gap-2">
                      <span>⚠️</span> Risks
                    </h3>
                    <ul className="space-y-2">
                      {prediction.feedback.risks.map((risk, index) => (
                        <li key={index} className="flex items-start text-gray-700 text-sm">
                          <svg className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Tactical Analysis - Strengths & Weaknesses */}
                {(prediction.feedback as any).tacticalAnalysis && 
                 (prediction.feedback as any).tacticalAnalysis.strengths &&
                 (prediction.feedback as any).tacticalAnalysis.weaknesses && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border-l-4 border-yellow-600">
                    <h3 className="text-lg font-bold text-yellow-700 mb-4 flex items-center gap-2">
                      <span>🎯</span> TACTICAL BREAKDOWN
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      {/* Strengths */}
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="font-bold text-green-600 mb-3 flex items-center gap-2">
                          <span>✅</span> Strengths
                        </h4>
                        {Object.entries((prediction.feedback as any).tacticalAnalysis.strengths || {}).map(([team, items]: [string, any]) => (
                          <div key={team} className="mb-3">
                            <p className="font-semibold text-sm text-gray-700 mb-1">{team}:</p>
                            <ul className="space-y-1">
                              {items && items.length > 0 ? items.map((item: string, idx: number) => (
                                <li key={idx} className="text-xs text-gray-600 flex items-start">
                                  <span className="text-green-500 mr-1">•</span>
                                  <span>{item}</span>
                                </li>
                              )) : <li className="text-xs text-gray-400 italic">No major strengths identified</li>}
                            </ul>
                          </div>
                        ))}
                      </div>
                      {/* Weaknesses */}
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="font-bold text-red-600 mb-3 flex items-center gap-2">
                          <span>⚠️</span> Weaknesses
                        </h4>
                        {Object.entries((prediction.feedback as any).tacticalAnalysis.weaknesses || {}).map(([team, items]: [string, any]) => (
                          <div key={team} className="mb-3">
                            <p className="font-semibold text-sm text-gray-700 mb-1">{team}:</p>
                            <ul className="space-y-1">
                              {items && items.length > 0 ? items.map((item: string, idx: number) => (
                                <li key={idx} className="text-xs text-gray-600 flex items-start">
                                  <span className="text-red-500 mr-1">•</span>
                                  <span>{item}</span>
                                </li>
                              )) : <li className="text-xs text-gray-400 italic">No critical weaknesses detected</li>}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Bottom Line */}
                    {(prediction.feedback as any).tacticalAnalysis.bottomLine && (
                      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-4 rounded-lg border border-yellow-300">
                        <p className="text-sm font-bold text-yellow-800">💡 Bottom Line: {(prediction.feedback as any).tacticalAnalysis.bottomLine}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Key Factors */}
                {prediction.feedback.keyFactors.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <span>🔑</span> Key Factors
                    </h3>
                    <ul className="space-y-2">
                      {prediction.feedback.keyFactors.map((factor, index) => (
                        <li key={index} className="flex items-start text-gray-700 text-sm bg-gray-50 p-3 rounded">
                          <span className="text-blue-600 font-bold mr-2">•</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* What Would Change My Mind */}
                {prediction.feedback.whatWouldChangeMyMind.length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-600">
                    <h4 className="font-bold text-purple-600 mb-3">🔄 What Would Change My Mind</h4>
                    <ul className="space-y-2 text-sm">
                      {prediction.feedback.whatWouldChangeMyMind.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-purple-600 font-bold mr-2">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Analysis Details */}
                <div className="border-t pt-4 mt-8 bg-gray-50 p-4 rounded">
                  <h4 className="font-bold mb-3 text-gray-800">📊 Analysis Details</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700">
                    <div>
                      <p className="font-semibold">Model</p>
                      <p className="text-xs">{prediction.feedback.llmModel}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Processing</p>
                      <p className="text-xs">{prediction.feedback.processingTimeMs}ms</p>
                    </div>
                    <div>
                      <p className="font-semibold">Analyzed</p>
                      <p className="text-xs">{formatDate(prediction.feedback.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded">
              <p className="text-yellow-800 font-semibold">
                🔄 AI Analysis In Progress
              </p>
              <p className="text-yellow-700 mt-2">
                {isRefreshing ? 'Checking for updates...' : 'This prediction is being analyzed. Updates coming every 2 seconds.'}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                  <span className="text-sm text-yellow-800">{isRefreshing ? 'Refreshing...' : 'Polling for feedback'}</span>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 mt-3">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                Live polling active
              </label>
            </div>
          )}
        </div>

        {/* Right Column - Metadata & Actions */}
        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Prediction Info</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Created</p>
                <p className="text-gray-900">{formatDate(prediction.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Updated</p>
                <p className="text-gray-900">{formatDate(prediction.updatedAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">ID</p>
                <p className="text-gray-900 font-mono text-xs break-all">
                  {prediction.id}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Created By</p>
                <p className="text-gray-900">
                  {prediction.user.name || prediction.user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Status Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Status</h3>
            <div
              className={`p-4 rounded-lg text-center ${getStatusColor(
                prediction.status
              )}`}
            >
              <p className="font-semibold">
                {getStatusLabel(prediction.status)}
              </p>
              <p className="text-sm mt-1">{prediction.status}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
