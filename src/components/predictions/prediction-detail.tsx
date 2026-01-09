'use client';

import { Prediction, Feedback } from '@prisma/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { getTeamBadgeUrl } from '@/lib/team-badges';

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

export default function PredictionDetail({ prediction }: PredictionDetailProps) {
  const router = useRouter();
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh the page while feedback is pending (dev convenience)
  useEffect(() => {
    if (!prediction.feedback && autoRefresh) {
      const t = setInterval(() => {
        router.refresh();
      }, 3000);
      return () => clearInterval(t);
    }
  }, [prediction.feedback, autoRefresh, router]);

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
                      <div className="text-6xl mb-4 opacity-80">⚽</div>
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
                        <img 
                          src={getTeamBadgeUrl(prediction.canonicalHomeTeamId.replace('custom:', '').replace(/-/g, ' '))}
                          alt="Home team badge"
                          className="w-24 h-24 mb-4 object-contain"
                        />
                      <h3 className="text-3xl font-black text-white text-center mb-4 tracking-tight">
                        {prediction.canonicalAwayTeamId.replace('custom:', '').replace(/-/g, ' ')}
                      </h3>
                      <div className="bg-white rounded-lg p-5 w-full shadow-lg border-2 border-black">
                        <p className="text-xs text-black font-black mb-2 text-center uppercase tracking-widest">Form</p>
                        <p className="text-3xl font-black text-black text-center tracking-widest">
                        <img 
                          src={getTeamBadgeUrl(prediction.canonicalAwayTeamId.replace('custom:', '').replace(/-/g, ' '))}
                          alt="Away team badge"
                          className="w-24 h-24 mb-4 object-contain"
                        />
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

                {/* Team Comparison Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg border-l-4 border-purple-600 shadow-sm">
                    <h4 className="font-bold text-purple-600 mb-2">📊 Team Comparison</h4>
                    {(prediction.feedback as any).teamComparison ? (
                      <div className="space-y-2 text-sm">
                        <p><span className="font-semibold">Home:</span> {(prediction.feedback as any).teamComparison.home}</p>
                        <p><span className="font-semibold">Away:</span> {(prediction.feedback as any).teamComparison.away}</p>
                      </div>
                    ) : <p className="text-gray-600">No comparison data</p>}
                  </div>

                  <div className="bg-white p-4 rounded-lg border-l-4 border-indigo-600 shadow-sm">
                    <h4 className="font-bold text-indigo-600 mb-2">📈 Season Stats</h4>
                    {(prediction.feedback as any).formAnalysis ? (
                      <div className="space-y-1 text-xs">
                        <p><span className="font-semibold">Home Form:</span> {(prediction.feedback as any).formAnalysis.homeRecentForm}</p>
                        <p><span className="font-semibold">Away Form:</span> {(prediction.feedback as any).formAnalysis.awayRecentForm}</p>
                      </div>
                    ) : <p className="text-gray-600">No stats data</p>}
                  </div>
                </div>

                {/* H2H & Market Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg border-l-4 border-orange-600 shadow-sm">
                    <h4 className="font-bold text-orange-600 mb-3">⚔️ Head-to-Head</h4>
                    {(prediction.feedback as any).headToHeadStats ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Home Wins:</span>
                          <span className="font-bold">{(prediction.feedback as any).headToHeadStats.homeWins}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Away Wins:</span>
                          <span className="font-bold">{(prediction.feedback as any).headToHeadStats.awayWins}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Draws:</span>
                          <span className="font-bold">{(prediction.feedback as any).headToHeadStats.draws}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 mt-2">
                          <span>Total:</span>
                          <span className="font-bold">{(prediction.feedback as any).headToHeadStats.totalMatches} matches</span>
                        </div>
                      </div>
                    ) : <p className="text-gray-600">No H2H data</p>}
                  </div>

                  <div className="bg-white p-4 rounded-lg border-l-4 border-green-600 shadow-sm">
                    <h4 className="font-bold text-green-600 mb-3">💰 Market Odds</h4>
                    {(prediction.feedback as any).marketInsight ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Home Win:</span>
                          <span className="font-bold">{(prediction.feedback as any).marketInsight.odds.homeWin?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Draw:</span>
                          <span className="font-bold">{(prediction.feedback as any).marketInsight.odds.draw?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Away Win:</span>
                          <span className="font-bold">{(prediction.feedback as any).marketInsight.odds.awayWin?.toFixed(2)}</span>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <p className="text-xs text-gray-600">Implied: {(prediction.feedback as any).marketInsight.impliedProbability}</p>
                        </div>
                      </div>
                    ) : <p className="text-gray-600">No odds data</p>}
                  </div>
                </div>

                {/* Injury News */}
                {(prediction.feedback as any).injuryNews && (prediction.feedback as any).injuryNews.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-600">
                    <h4 className="font-bold text-red-600 mb-3">🏥 Injury News</h4>
                    <ul className="space-y-1 text-sm">
                      {(prediction.feedback as any).injuryNews.map((injury: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-red-600 mr-2">⚠️</span>
                          <span>{injury}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

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

                {/* Tactical Analysis */}
                {(prediction.feedback as any).tacticalAnalysis && (prediction.feedback as any).tacticalAnalysis.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-600">
                    <h4 className="font-bold text-yellow-600 mb-3">🎯 Tactical Analysis</h4>
                    <ul className="space-y-2 text-sm">
                      {(prediction.feedback as any).tacticalAnalysis.map((item: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-yellow-600 font-bold mr-2">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
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
                AI Analysis Pending
              </p>
              <p className="text-yellow-700 mt-2">
                This prediction is still being analyzed. Check back in a few
                moments for AI feedback.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => router.refresh()}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Refresh Now
                </button>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                  Auto-refresh every 3s
                </label>
              </div>
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
