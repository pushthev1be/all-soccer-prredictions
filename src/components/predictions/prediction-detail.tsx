'use client';

import { Prediction, Feedback } from '@prisma/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    <div className="container mx-auto px-4 py-8">
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
          <div className="bg-white rounded-lg shadow p-6">
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
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">AI Feedback & Analysis</h2>

              {/* Confidence Score */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">Confidence Score</h3>
                  <span className="text-2xl font-bold text-blue-600">
                    {(prediction.feedback.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
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
                <p className="text-sm text-gray-600 mt-3">
                  {prediction.feedback.confidenceExplanation}
                </p>
              </div>

              {/* Summary */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3">Summary</h3>
                <p className="text-gray-700 bg-blue-50 p-4 rounded border-l-4 border-blue-600">
                  {prediction.feedback.summary}
                </p>
              </div>

              {/* Strengths & Risks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-green-600 mb-3">
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {prediction.feedback.strengths.map((strength, index) => (
                      <li
                        key={index}
                        className="flex items-start text-gray-700"
                      >
                        <svg
                          className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-red-600 mb-3">
                    Risks
                  </h3>
                  <ul className="space-y-2">
                    {prediction.feedback.risks.map((risk, index) => (
                      <li
                        key={index}
                        className="flex items-start text-gray-700"
                      >
                        <svg
                          className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Key Factors */}
              {prediction.feedback.keyFactors.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-3">Key Factors</h3>
                  <ul className="space-y-2">
                    {prediction.feedback.keyFactors.map((factor, index) => (
                      <li key={index} className="flex items-start text-gray-700">
                        <span className="text-blue-600 font-bold mr-3">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What Would Change My Mind */}
              {prediction.feedback.whatWouldChangeMyMind.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-3">
                    What Would Change My Mind
                  </h3>
                  <ul className="space-y-2">
                    {prediction.feedback.whatWouldChangeMyMind.map(
                      (item, index) => (
                        <li
                          key={index}
                          className="flex items-start text-gray-700"
                        >
                          <span className="text-orange-600 font-bold mr-3">
                            •
                          </span>
                          <span>{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {/* Metadata */}
              <div className="border-t pt-4 mt-8">
                <h4 className="font-semibold mb-3">Analysis Details</h4>
                <div className="grid grid-cols-2 text-sm text-gray-600 space-y-2">
                  <div>Model: {prediction.feedback.llmModel}</div>
                  <div>
                    Processing Time: {prediction.feedback.processingTimeMs}ms
                  </div>
                  <div>
                    Analyzed: {formatDate(prediction.feedback.createdAt)}
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
