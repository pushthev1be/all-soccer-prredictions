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
        return 'bg-white text-black border-2 border-black';
      case 'failed':
        return 'bg-black text-white';
      case 'processing':
        return 'bg-gray-200 text-black border border-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
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
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 bg-white min-h-screen">
      <Link
        href="/predictions"
        className="inline-flex items-center text-black hover:text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base font-medium"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Match Info Card - Clean Black/White */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-black p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0 mb-4 sm:mb-6">
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-black">
                  {prediction.canonicalHomeTeamId
                    .replace('custom:', '')
                    .replace(/-/g, ' ')}{' '}
                  vs{' '}
                  {prediction.canonicalAwayTeamId
                    .replace('custom:', '')
                    .replace(/-/g, ' ')}
                </h1>
                <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                  {prediction.canonicalCompetitionId
                    .replace('custom:', '')
                    .replace(/-/g, ' ')}
                </p>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold ${getStatusColor(
                  prediction.status
                )}`}
              >
                {getStatusLabel(prediction.status)}
              </span>
            </div>

            {/* Stats Grid - Compact & Clean */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="border-l-2 border-black pl-3 py-1">
                <p className="text-xs font-medium text-gray-500 uppercase">Market</p>
                <p className="text-sm sm:text-lg font-bold text-black">{prediction.market}</p>
              </div>
              <div className="border-l-2 border-black pl-3 py-1">
                <p className="text-xs font-medium text-gray-500 uppercase">Pick</p>
                <p className="text-sm sm:text-lg font-bold text-black">{prediction.pick}</p>
              </div>
              <div className="border-l-2 border-black pl-3 py-1">
                <p className="text-xs font-medium text-gray-500 uppercase">Odds</p>
                <p className="text-sm sm:text-lg font-bold text-black">{prediction.odds || 'N/A'}</p>
              </div>
              <div className="border-l-2 border-black pl-3 py-1">
                <p className="text-xs font-medium text-gray-500 uppercase">Stake</p>
                <p className="text-sm sm:text-lg font-bold text-black">{prediction.stake || 'N/A'}</p>
              </div>
            </div>

            {/* Kickoff & Reasoning - Condensed */}
            <div className="space-y-3 sm:space-y-4 text-sm sm:text-base">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="font-semibold text-black">Kickoff:</span>
                <span className="text-gray-700">{formatDate(prediction.kickoffTimeUTC)}</span>
              </div>

              <div>
                <p className="font-semibold text-black mb-1">Your Reasoning</p>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">
                  {prediction.reasoning}
                </p>
              </div>

              {prediction.bookmaker && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-black">Bookmaker:</span>
                  <span className="text-gray-700">{prediction.bookmaker}</span>
                </div>
              )}
            </div>
          </div>

          {/* Feedback Section */}
          {prediction.feedback ? (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-black overflow-hidden">
              <div className="bg-black p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white">AI Analysis</h2>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* AI Recommended Bet */}
                {(prediction.feedback as any).recommendedBet && (
                  <div className="bg-black text-white rounded-xl p-4 sm:p-5">
                    <p className="text-[10px] sm:text-xs uppercase text-white/70 mb-1">AI Suggested Bet</p>
                    <p className="text-sm sm:text-base font-bold tracking-wide">
                      {(prediction.feedback as any).recommendedBet}
                    </p>
                  </div>
                )}

                {/* Data Quality + Confidence Range */}
                {(((prediction.feedback as any).qualityTier || (prediction.feedback as any).dataCompleteness !== undefined) || (prediction.feedback as any).confidenceIntervals) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-white border-2 border-black rounded-xl p-4">
                      <p className="text-[10px] sm:text-xs text-gray-500 uppercase mb-1">Data Quality</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-bold text-black">
                          {(prediction.feedback as any).qualityTier || 'N/A'}
                        </span>
                        {(prediction.feedback as any).dataCompleteness !== undefined && (
                          <span className="text-xs sm:text-sm text-gray-600">
                            {(prediction.feedback as any).dataCompleteness}% complete
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="bg-white border-2 border-black rounded-xl p-4">
                      <p className="text-[10px] sm:text-xs text-gray-500 uppercase mb-1">Confidence Range</p>
                      <p className="text-sm sm:text-base font-bold text-black">
                        {((prediction.feedback as any).confidenceIntervals?.lowerBound !== undefined && (prediction.feedback as any).confidenceIntervals?.upperBound !== undefined)
                          ? `${(((prediction.feedback as any).confidenceIntervals.lowerBound as number) * 100).toFixed(0)}%–${(((prediction.feedback as any).confidenceIntervals.upperBound as number) * 100).toFixed(0)}%`
                          : 'N/A'}
                      </p>
                      {(prediction.feedback as any).confidenceIntervals?.volatility && (
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                          Volatility: {(prediction.feedback as any).confidenceIntervals.volatility}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Alternative Bets */}
                {Array.isArray((prediction.feedback as any).alternativeBets) && (prediction.feedback as any).alternativeBets.length > 0 && (
                  <div className="bg-white border-2 border-black rounded-xl p-4 sm:p-5">
                    <h3 className="text-sm sm:text-base font-bold text-black mb-3">Alternative Bets</h3>
                    <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                      {(prediction.feedback as any).alternativeBets.slice(0, 2).map((item: any, index: number) => (
                        <li key={`alt-bet-${index}`} className="flex items-start">
                          <span className="text-black font-bold mr-2">•</span>
                          <div>
                            <div className="font-semibold text-black">{item.bet}</div>
                            <div className="text-gray-600">{item.rationale}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Alternative Angles */}
                {(prediction.feedback as any).alternativeViews && (
                  <div className="bg-gray-50 border-2 border-black rounded-xl p-4 sm:p-5">
                    <h3 className="text-sm sm:text-base font-bold text-black mb-3">Alternative Angles</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-xs font-bold text-green-700 mb-1">🐂 Bull Case</p>
                        <p className="text-xs sm:text-sm text-green-800">{(prediction.feedback as any).alternativeViews.bullish}</p>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs font-bold text-red-700 mb-1">🐻 Bear Case</p>
                        <p className="text-xs sm:text-sm text-red-800">{(prediction.feedback as any).alternativeViews.bearish}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <p className="text-xs font-bold text-gray-800 mb-1">⚖️ Neutral</p>
                        <p className="text-xs sm:text-sm text-gray-700">{(prediction.feedback as any).alternativeViews.neutral}</p>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-xs font-bold text-yellow-700 mb-1">🧠 Contrarian</p>
                        <p className="text-xs sm:text-sm text-yellow-800">{(prediction.feedback as any).alternativeViews.contrarian}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actionable Insights */}
                {(prediction.feedback as any).actionableInsights && (
                  <div className="bg-white border-2 border-black rounded-xl p-4 sm:p-5">
                    <h3 className="text-sm sm:text-base font-bold text-black mb-3">Actionable Insights</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase mb-1">Bet Sizing</p>
                        <p className="text-sm sm:text-base font-bold text-black">
                          {(prediction.feedback as any).actionableInsights.betSizing}
                        </p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase mb-1">Timeframe</p>
                        <p className="text-sm sm:text-base font-bold text-black">
                          {(prediction.feedback as any).actionableInsights.timeframe}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Historical Context */}
                {(prediction.feedback as any).historicalComparisons?.similarMatches?.length > 0 && (
                  <div className="bg-white border-2 border-black rounded-xl p-4 sm:p-5">
                    <h3 className="text-sm sm:text-base font-bold text-black mb-3">Historical Context</h3>
                    <ul className="space-y-1 text-xs sm:text-sm text-gray-700">
                      {(prediction.feedback as any).historicalComparisons.similarMatches.slice(0, 4).map((item: string, index: number) => (
                        <li key={`hist-${index}`} className="flex items-start">
                          <span className="text-black font-bold mr-2">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    {(prediction.feedback as any).historicalComparisons.winRateInContext && (
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-2">
                        {(prediction.feedback as any).historicalComparisons.winRateInContext}
                      </p>
                    )}
                  </div>
                )}

                {/* What the Numbers Say */}
                {(prediction.feedback as any).numbersSummary && (
                  <div className="bg-white border-2 border-black rounded-xl p-4 sm:p-5">
                    <h3 className="text-sm sm:text-base font-bold text-black mb-3">What the Numbers Say</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase mb-2">Probabilities</p>
                        <ul className="space-y-1 text-xs sm:text-sm text-gray-700">
                          {Object.entries((prediction.feedback as any).numbersSummary.probabilities || {}).map(([key, value]: [string, any]) => (
                            <li key={`prob-${key}`} className="flex justify-between">
                              <span className="capitalize">{key}</span>
                              <span className="font-semibold text-black">{value ?? 'N/A'}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase mb-2">Key Metrics</p>
                        <ul className="space-y-1 text-xs sm:text-sm text-gray-700">
                          {Object.entries((prediction.feedback as any).numbersSummary.metrics || {}).slice(0, 4).map(([key, value]: [string, any]) => (
                            <li key={`metric-${key}`} className="flex justify-between">
                              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="font-semibold text-black">{value ?? 'N/A'}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Validation Notes */}
                {Array.isArray((prediction.feedback as any).validationIssues) && (prediction.feedback as any).validationIssues.length > 0 && (
                  <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-4 sm:p-5">
                    <h3 className="text-sm sm:text-base font-bold text-black mb-2">Validation Notes</h3>
                    <ul className="space-y-1 text-xs sm:text-sm text-gray-700">
                      {(prediction.feedback as any).validationIssues.slice(0, 3).map((issue: string, index: number) => (
                        <li key={`validation-issue-${index}`} className="flex items-start">
                          <span className="text-black font-bold mr-2">•</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Scoreline & Likely Scorers */}
                {(((prediction.feedback as any).scorelinePrediction) || ((prediction.feedback as any).likelyScorers)) && (
                  <div className="bg-white border-2 border-black rounded-xl p-4 sm:p-5">
                    <h3 className="text-sm sm:text-base font-bold text-black mb-3">Scoreline & Likely Scorers</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase mb-1">Predicted Scoreline</p>
                        <p className="text-lg sm:text-2xl font-black text-black tracking-wider">
                          {(prediction.feedback as any).scorelinePrediction || 'N/A'}
                        </p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase mb-2">Likely Scorers</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white border border-gray-200 rounded-md p-2">
                            <p className="text-[10px] sm:text-xs font-semibold text-black mb-1">Home</p>
                            <ul className="space-y-1 text-[10px] sm:text-xs text-gray-700">
                              {(((prediction.feedback as any).likelyScorers?.home as string[]) || []).slice(0, 3).map((player: string, index: number) => (
                                <li key={`home-scorer-${index}`} className="flex items-start">
                                  <span className="text-black font-bold mr-1">•</span>
                                  <span>{player}</span>
                                </li>
                              ))}
                              {(!((prediction.feedback as any).likelyScorers?.home) || ((prediction.feedback as any).likelyScorers?.home?.length ?? 0) === 0) && (
                                <li className="text-gray-400">No data</li>
                              )}
                            </ul>
                          </div>
                          <div className="bg-white border border-gray-200 rounded-md p-2">
                            <p className="text-[10px] sm:text-xs font-semibold text-black mb-1">Away</p>
                            <ul className="space-y-1 text-[10px] sm:text-xs text-gray-700">
                              {(((prediction.feedback as any).likelyScorers?.away as string[]) || []).slice(0, 3).map((player: string, index: number) => (
                                <li key={`away-scorer-${index}`} className="flex items-start">
                                  <span className="text-black font-bold mr-1">•</span>
                                  <span>{player}</span>
                                </li>
                              ))}
                              {(!((prediction.feedback as any).likelyScorers?.away) || ((prediction.feedback as any).likelyScorers?.away?.length ?? 0) === 0) && (
                                <li className="text-gray-400">No data</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Team Form Comparison - Compact */}
                <div className="bg-black rounded-xl p-4 sm:p-6">
                  <div className="grid grid-cols-2 gap-3 sm:gap-6">
                    {/* Home Team */}
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-2 sm:mb-3">
                        <TeamBadge
                          teamName={prediction.canonicalHomeTeamId.replace('custom:', '').replace(/-/g, ' ')}
                          size="lg"
                        />
                      </div>
                      <h3 className="text-sm sm:text-lg font-bold text-white mb-2 line-clamp-2">
                        {prediction.canonicalHomeTeamId.replace('custom:', '').replace(/-/g, ' ')}
                      </h3>
                      <div className="bg-white rounded-lg px-3 py-2 w-full border-2 border-white">
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase mb-1">Form</p>
                        <p className="text-lg sm:text-2xl font-black text-black tracking-wider">
                          {(prediction.feedback as any).formAnalysis?.homeRecentForm || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-2 sm:mb-3">
                        <TeamBadge
                          teamName={prediction.canonicalAwayTeamId.replace('custom:', '').replace(/-/g, ' ')}
                          size="lg"
                        />
                      </div>
                      <h3 className="text-sm sm:text-lg font-bold text-white mb-2 line-clamp-2">
                        {prediction.canonicalAwayTeamId.replace('custom:', '').replace(/-/g, ' ')}
                      </h3>
                      <div className="bg-white rounded-lg px-3 py-2 w-full border-2 border-white">
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase mb-1">Form</p>
                        <p className="text-lg sm:text-2xl font-black text-black tracking-wider">
                          {(prediction.feedback as any).formAnalysis?.awayRecentForm || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Final Verdict */}
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-700">
                    <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Verdict</p>
                    <p className="text-sm sm:text-base text-white leading-relaxed">
                      {prediction.feedback.summary || 'No verdict available'}
                    </p>
                  </div>
                </div>

                {/* Confidence Score - Clean */}
                <div className="p-4 sm:p-5 rounded-lg bg-gray-50 border-2 border-black">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm sm:text-base font-bold text-black">Confidence</h3>
                    <span className="text-2xl sm:text-3xl font-black text-black">
                      {(prediction.feedback.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-2 mb-3">
                    <div
                      className="h-2 rounded-full bg-black transition-all"
                      style={{
                        width: `${prediction.feedback.confidenceScore * 100}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {prediction.feedback.confidenceExplanation}
                  </p>
                </div>

                {/* Match Stats - Simplified Mobile-First Table */}
                {(prediction.feedback as any).teamComparison && (
                  <div className="bg-white p-3 sm:p-4 rounded-lg border-2 border-black">
                    <h3 className="text-sm sm:text-base font-bold text-black mb-3">Match Stats</h3>
                    <div className="overflow-x-auto -mx-3 sm:mx-0">
                      <table className="w-full text-xs sm:text-sm min-w-[500px]">
                        <thead>
                          <tr className="bg-black text-white">
                            <th className="text-left p-2 sm:p-3 font-bold">Team</th>
                            <th className="text-left p-2 sm:p-3 font-bold">Rank</th>
                            <th className="text-left p-2 sm:p-3 font-bold">Form</th>
                            <th className="text-left p-2 sm:p-3 font-bold">H2H</th>
                            <th className="text-left p-2 sm:p-3 font-bold">Injuries</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-200">
                            <td className="p-2 sm:p-3 font-bold text-black">{(prediction.feedback as any).teamComparison.home.name}</td>
                            <td className="p-2 sm:p-3 text-gray-700">{(prediction.feedback as any).teamComparison.home.ranking}</td>
                            <td className="p-2 sm:p-3 text-gray-700 font-mono">{(prediction.feedback as any).teamComparison.home.recentForm}</td>
                            <td className="p-2 sm:p-3 text-gray-700">{(prediction.feedback as any).teamComparison.home.headToHead}</td>
                            <td className="p-2 sm:p-3 text-gray-700">{(prediction.feedback as any).teamComparison.home.injuries}</td>
                          </tr>
                          <tr>
                            <td className="p-2 sm:p-3 font-bold text-black">{(prediction.feedback as any).teamComparison.away.name}</td>
                            <td className="p-2 sm:p-3 text-gray-700">{(prediction.feedback as any).teamComparison.away.ranking}</td>
                            <td className="p-2 sm:p-3 text-gray-700 font-mono">{(prediction.feedback as any).teamComparison.away.recentForm}</td>
                            <td className="p-2 sm:p-3 text-gray-700">{(prediction.feedback as any).teamComparison.away.headToHead}</td>
                            <td className="p-2 sm:p-3 text-gray-700">{(prediction.feedback as any).teamComparison.away.injuries}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Market Odds - Clean Black/White */}
                {(prediction.feedback as any).marketInsight && (
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border-2 border-black">
                    <h4 className="font-bold text-black mb-3 text-sm sm:text-base">Market Odds</h4>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center mb-3">
                      <div className="bg-white p-2 sm:p-3 rounded-lg border border-gray-300">
                        <div className="text-[10px] sm:text-xs text-gray-500 mb-1">Home</div>
                        <div className="text-lg sm:text-xl font-bold text-black">{(prediction.feedback as any).marketInsight.odds.homeWin?.toFixed(2)}</div>
                      </div>
                      <div className="bg-white p-2 sm:p-3 rounded-lg border border-gray-300">
                        <div className="text-[10px] sm:text-xs text-gray-500 mb-1">Draw</div>
                        <div className="text-lg sm:text-xl font-bold text-black">{(prediction.feedback as any).marketInsight.odds.draw?.toFixed(2)}</div>
                      </div>
                      <div className="bg-white p-2 sm:p-3 rounded-lg border border-gray-300">
                        <div className="text-[10px] sm:text-xs text-gray-500 mb-1">Away</div>
                        <div className="text-lg sm:text-xl font-bold text-black">{(prediction.feedback as any).marketInsight.odds.awayWin?.toFixed(2)}</div>
                      </div>
                    </div>
                    {(prediction.feedback as any).marketInsight.valueAssessment && (
                      <div className="bg-black text-white p-2 sm:p-3 rounded-lg">
                        <p className="text-xs sm:text-sm font-medium">{(prediction.feedback as any).marketInsight.valueAssessment}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Strengths & Risks - Compact Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white p-3 sm:p-4 rounded-lg border-2 border-black">
                    <h3 className="text-sm sm:text-base font-bold text-black mb-2">Strengths</h3>
                    <ul className="space-y-1.5">
                      {prediction.feedback.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start text-gray-700 text-xs sm:text-sm">
                          <span className="text-black mr-2 font-bold">+</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-gray-100 p-3 sm:p-4 rounded-lg border-2 border-black">
                    <h3 className="text-sm sm:text-base font-bold text-black mb-2">Risks</h3>
                    <ul className="space-y-1.5">
                      {prediction.feedback.risks.map((risk, index) => (
                        <li key={index} className="flex items-start text-gray-700 text-xs sm:text-sm">
                          <span className="text-black mr-2 font-bold">-</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Tactical Analysis - Simplified */}
                {(prediction.feedback as any).tacticalAnalysis && 
                 (prediction.feedback as any).tacticalAnalysis.strengths &&
                 (prediction.feedback as any).tacticalAnalysis.weaknesses && (
                  <div className="bg-white p-3 sm:p-4 rounded-lg border-2 border-black">
                    <h3 className="text-sm sm:text-base font-bold text-black mb-3">Tactical Analysis</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3">
                      {Object.entries((prediction.feedback as any).tacticalAnalysis.strengths || {}).map(([team, items]: [string, any]) => (
                        <div key={team} className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                          <p className="font-bold text-xs sm:text-sm text-black mb-1">{team}</p>
                          <ul className="space-y-1">
                            {items && items.length > 0 ? items.slice(0, 3).map((item: string, idx: number) => (
                              <li key={idx} className="text-[10px] sm:text-xs text-gray-600 flex items-start">
                                <span className="text-black mr-1">+</span>
                                <span>{item}</span>
                              </li>
                            )) : <li className="text-[10px] sm:text-xs text-gray-400">No data</li>}
                          </ul>
                        </div>
                      ))}
                    </div>
                    {(prediction.feedback as any).tacticalAnalysis.bottomLine && (
                      <div className="bg-black text-white p-2 sm:p-3 rounded-lg">
                        <p className="text-xs sm:text-sm font-medium">{(prediction.feedback as any).tacticalAnalysis.bottomLine}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Key Factors - Compact */}
                {prediction.feedback.keyFactors.length > 0 && (
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                    <h3 className="text-sm sm:text-base font-bold text-black mb-2">Key Factors</h3>
                    <ul className="space-y-1.5">
                      {prediction.feedback.keyFactors.slice(0, 5).map((factor, index) => (
                        <li key={index} className="flex items-start text-gray-700 text-xs sm:text-sm">
                          <span className="text-black font-bold mr-2">{index + 1}.</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* What Would Change My Mind - Simplified */}
                {prediction.feedback.whatWouldChangeMyMind.length > 0 && (
                  <div className="bg-gray-100 p-3 sm:p-4 rounded-lg border-2 border-gray-300">
                    <h4 className="font-bold text-black mb-2 text-sm sm:text-base">What Would Change This</h4>
                    <ul className="space-y-1.5 text-xs sm:text-sm">
                      {prediction.feedback.whatWouldChangeMyMind.slice(0, 3).map((item, index) => (
                        <li key={index} className="flex items-start text-gray-700">
                          <span className="text-black font-bold mr-2">-</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Analysis Details - Minimal Footer */}
                <div className="border-t border-gray-200 pt-3 mt-4">
                  <div className="flex flex-wrap gap-3 sm:gap-6 text-[10px] sm:text-xs text-gray-500">
                    <span>Model: {prediction.feedback.llmModel}</span>
                    <span>Time: {prediction.feedback.processingTimeMs}ms</span>
                    <span>Analyzed: {formatDate(prediction.feedback.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 border-2 border-black p-4 sm:p-6 rounded-xl">
              <p className="text-black font-bold text-sm sm:text-base">
                Analysis In Progress
              </p>
              <p className="text-gray-600 mt-2 text-xs sm:text-sm">
                {isRefreshing ? 'Checking for updates...' : 'Being analyzed. Updates every 2 seconds.'}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                <span className="text-xs sm:text-sm text-gray-700">{isRefreshing ? 'Refreshing...' : 'Polling'}</span>
              </div>
              <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mt-3">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="accent-black"
                />
                Live polling
              </label>
            </div>
          )}
        </div>

        {/* Right Column - Metadata & Actions */}
        <div className="space-y-4 sm:space-y-6">
          {/* Info Card - Compact */}
          <div className="bg-white rounded-xl border-2 border-black p-4 sm:p-5">
            <h3 className="text-sm sm:text-base font-bold text-black mb-3">Info</h3>
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-black font-medium">{formatDate(prediction.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Updated</span>
                <span className="text-black font-medium">{formatDate(prediction.updatedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">By</span>
                <span className="text-black font-medium truncate ml-2">
                  {prediction.user.name || prediction.user.email}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-gray-500 text-[10px] sm:text-xs">ID</p>
                <p className="text-black font-mono text-[10px] sm:text-xs break-all">
                  {prediction.id}
                </p>
              </div>
            </div>
          </div>

          {/* Status Card - Compact */}
          <div className="bg-white rounded-xl border-2 border-black p-4 sm:p-5">
            <h3 className="text-sm sm:text-base font-bold text-black mb-3">Status</h3>
            <div
              className={`p-3 rounded-lg text-center ${getStatusColor(
                prediction.status
              )}`}
            >
              <p className="font-bold text-sm sm:text-base">
                {getStatusLabel(prediction.status)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
