/**
 * Enhanced Feedback UI Components
 * Visual components for displaying improved prediction feedback
 */

'use client';

import React from 'react';

interface KeyInsightCardProps {
  title: string;
  insights: string[];
  icon: string;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

const colorMap = {
  blue: 'border-blue-500 bg-blue-50',
  green: 'border-green-500 bg-green-50',
  red: 'border-red-500 bg-red-50',
  yellow: 'border-yellow-500 bg-yellow-50',
  purple: 'border-purple-500 bg-purple-50',
};

export function KeyInsightCard({ title, insights, icon, color }: KeyInsightCardProps) {
  return (
    <div className={`border-l-4 ${colorMap[color]} pl-4 py-3 rounded-r`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <h4 className="font-bold text-sm text-gray-900">{title}</h4>
      </div>
      <ul className="space-y-1">
        {insights.map((insight, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="mt-0.5">•</span>
            <span>{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ConfidenceBreakdownProps {
  factors: Array<{ name: string; score: number; weight: number }>;
  confidence: number;
  explanation: string;
}

export function ConfidenceBreakdown({ factors, confidence, explanation }: ConfidenceBreakdownProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
      <h4 className="font-bold text-sm mb-3">Confidence Breakdown ({(confidence * 100).toFixed(0)}%)</h4>
      <div className="space-y-2">
        {factors.map((factor) => (
          <div key={factor.name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">{factor.name}</span>
              <span className="text-gray-600">
                {(factor.score * 100).toFixed(0)}% (weight: {(factor.weight * 100).toFixed(0)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${factor.score * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-600 mt-3 italic">{explanation}</p>
    </div>
  );
}

interface NumbersSummaryProps {
  metrics: Record<string, string | number | null>;
  probabilities: Record<string, string | number | null>;
  valueIndicators: Record<string, string | number | null>;
}

export function NumbersSummary({ metrics, probabilities, valueIndicators }: NumbersSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Metrics */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="font-bold text-sm mb-3 text-gray-900">📊 Metrics</h4>
        <div className="space-y-2 text-sm">
          {Object.entries(metrics).map(([key, value]) =>
            value !== null ? (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600">{key}</span>
                <span className="font-medium">{value}</span>
              </div>
            ) : null
          )}
        </div>
      </div>

      {/* Probabilities */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-bold text-sm mb-3 text-gray-900">📈 Probabilities</h4>
        <div className="space-y-2 text-sm">
          {Object.entries(probabilities).map(([key, value]) =>
            value !== null ? (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600">{key}</span>
                <span className="font-medium text-blue-600">{value}</span>
              </div>
            ) : null
          )}
        </div>
      </div>

      {/* Value Indicators */}
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h4 className="font-bold text-sm mb-3 text-gray-900">💰 Value</h4>
        <div className="space-y-2 text-sm">
          {Object.entries(valueIndicators).map(([key, value]) =>
            value !== null ? (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600">{key}</span>
                <span className="font-medium text-green-600 text-xs">{value}</span>
              </div>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}

interface AlternativePerspectivesProps {
  bullish: string;
  bearish: string;
  neutral: string;
  contrarian: string;
}

export function AlternativePerspectives({
  bullish,
  bearish,
  neutral,
  contrarian,
}: AlternativePerspectivesProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h4 className="font-bold mb-3">Alternative Angles</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-green-50 p-3 rounded border border-green-200">
          <h5 className="font-semibold text-green-700 text-sm mb-1">🐂 Bull Case</h5>
          <p className="text-xs text-gray-700">{bullish}</p>
        </div>
        <div className="bg-red-50 p-3 rounded border border-red-200">
          <h5 className="font-semibold text-red-700 text-sm mb-1">🐻 Bear Case</h5>
          <p className="text-xs text-gray-700">{bearish}</p>
        </div>
        <div className="bg-gray-100 p-3 rounded border border-gray-300">
          <h5 className="font-semibold text-gray-700 text-sm mb-1">⚪ Neutral</h5>
          <p className="text-xs text-gray-700">{neutral}</p>
        </div>
        <div className="bg-purple-50 p-3 rounded border border-purple-200">
          <h5 className="font-semibold text-purple-700 text-sm mb-1">🔄 Contrarian</h5>
          <p className="text-xs text-gray-700">{contrarian}</p>
        </div>
      </div>
    </div>
  );
}

interface ValidationFeedbackProps {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  qualityScore: number;
}

export function ValidationFeedback({ isValid, issues, suggestions, qualityScore }: ValidationFeedbackProps) {
  const bgColor = qualityScore >= 80 ? 'bg-green-50' : qualityScore >= 60 ? 'bg-yellow-50' : 'bg-red-50';
  const borderColor = qualityScore >= 80 ? 'border-green-200' : qualityScore >= 60 ? 'border-yellow-200' : 'border-red-200';
  const textColor = qualityScore >= 80 ? 'text-green-700' : qualityScore >= 60 ? 'text-yellow-700' : 'text-red-700';

  return (
    <div className={`${bgColor} p-4 rounded-lg border ${borderColor}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold">Analysis Quality</h4>
        <span className={`${textColor} font-bold text-lg`}>{qualityScore}%</span>
      </div>

      {issues.length > 0 && (
        <div className="mb-3">
          <h5 className="font-semibold text-sm mb-2">Issues Found:</h5>
          <ul className="space-y-1">
            {issues.map((issue, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-red-500 mt-0.5">✗</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {suggestions.length > 0 && (
        <div>
          <h5 className="font-semibold text-sm mb-2">Suggestions:</h5>
          <ul className="space-y-1">
            {suggestions.map((suggestion, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-blue-500 mt-0.5">→</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isValid && issues.length === 0 && (
        <div className="text-sm font-medium text-green-700">✓ Analysis quality is strong</div>
      )}
    </div>
  );
}

interface SmartTimingProps {
  kickoffTimeUTC: string;
}

export function SmartUpdateTiming({ kickoffTimeUTC }: SmartTimingProps) {
  const timeToKickoff = new Date(kickoffTimeUTC).getTime() - Date.now();
  const hours = Math.floor(timeToKickoff / 3600000);
  const minutes = Math.floor((timeToKickoff % 3600000) / 60000);

  let updateFrequency = '10 seconds';
  let updateReason = 'Standard polling';

  if (timeToKickoff > 3600000) {
    updateFrequency = '10 seconds';
    updateReason = 'Match is >1h away';
  } else if (timeToKickoff > 15 * 60 * 1000) {
    updateFrequency = '5 seconds';
    updateReason = 'Match in <1h, monitor for late news';
  } else {
    updateFrequency = '2 seconds';
    updateReason = 'Match starting soon - watch for final lineup changes';
  }

  return (
    <div className="bg-blue-50 p-3 rounded border border-blue-200 text-xs">
      <div className="flex justify-between items-center">
        <span>
          ⏱️ {hours}h {minutes}m until kickoff
        </span>
        <span className="text-gray-600">
          Updating every {updateFrequency} ({updateReason})
        </span>
      </div>
    </div>
  );
}
