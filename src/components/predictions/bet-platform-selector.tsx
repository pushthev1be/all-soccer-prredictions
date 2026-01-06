'use client';
import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Shield, Zap, ChevronDown, Check } from "lucide-react";

const BET_PLATFORMS = [
  {
    id: "bet365",
    name: "Bet365",
    logo: "🟢",
    color: "bg-green-50 border-green-200",
    markets: {
      "1X2": [
        { pick: "1", odds: 3.5, impliedProbability: 28.6 },
        { pick: "X", odds: 3.4, impliedProbability: 29.4 },
        { pick: "2", odds: 2.2, impliedProbability: 45.5 },
      ],
      "Over/Under": [
        { pick: "Over 2.5", odds: 2.1, impliedProbability: 47.6 },
        { pick: "Under 2.5", odds: 1.8, impliedProbability: 55.6 },
      ],
      BTTS: [
        { pick: "Yes", odds: 1.75, impliedProbability: 57.1 },
        { pick: "No", odds: 2.05, impliedProbability: 48.8 },
      ],
      "Double Chance": [
        { pick: "1X", odds: 1.8 },
        { pick: "12", odds: 1.4 },
        { pick: "X2", odds: 1.3 },
      ],
    },
  },
  {
    id: "william-hill",
    name: "William Hill",
    logo: "🔵",
    color: "bg-blue-50 border-blue-200",
    markets: {
      "1X2": [
        { pick: "1", odds: 3.6, impliedProbability: 27.8 },
        { pick: "X", odds: 3.3, impliedProbability: 30.3 },
        { pick: "2", odds: 2.15, impliedProbability: 46.5 },
      ],
      "Over/Under": [
        { pick: "Over 2.5", odds: 2.15, impliedProbability: 46.5 },
        { pick: "Under 2.5", odds: 1.75, impliedProbability: 57.1 },
      ],
    },
  },
  {
    id: "draftkings",
    name: "DraftKings",
    logo: "🟣",
    color: "bg-purple-50 border-purple-200",
    markets: {
      "1X2": [
        { pick: "1", odds: 3.45, impliedProbability: 29.0 },
        { pick: "X", odds: 3.5, impliedProbability: 28.6 },
        { pick: "2", odds: 2.25, impliedProbability: 44.4 },
      ],
      "Correct Score": [
        { pick: "1-0", odds: 9.0 },
        { pick: "2-1", odds: 8.5 },
        { pick: "2-2", odds: 12.0 },
      ],
    },
  },
  {
    id: "fanduel",
    name: "FanDuel",
    logo: "🟠",
    color: "bg-orange-50 border-orange-200",
    markets: {
      "1X2": [
        { pick: "1", odds: 3.55, impliedProbability: 28.2 },
        { pick: "X", odds: 3.45, impliedProbability: 29.0 },
        { pick: "2", odds: 2.2, impliedProbability: 45.5 },
      ],
      "Double Chance": [
        { pick: "1X", odds: 1.8 },
        { pick: "12", odds: 1.4 },
        { pick: "X2", odds: 1.3 },
      ],
    },
  },
];

interface BetPlatformSelectorProps {
  market: string;
  onOddsSelect: (odds: number, platform: string) => void;
  onPlatformSelect?: (platform: string) => void;
  selectedPlatform?: string;
}

export function BetPlatformSelector({ market, onOddsSelect, onPlatformSelect, selectedPlatform: externalSelectedPlatform }: BetPlatformSelectorProps) {
  const [internalSelectedPlatform, setInternalSelectedPlatform] = useState<string>("bet365");
  const [isOpen, setIsOpen] = useState(false);
  const [bestOdds, setBestOdds] = useState<Record<string, any>>({});

  const selectedPlatform = externalSelectedPlatform || internalSelectedPlatform;

  useEffect(() => {
    if (!market) return;

    const allOdds: Record<string, any> = {};

    BET_PLATFORMS.forEach((platform) => {
      const marketData = platform.markets[market as keyof typeof platform.markets];
      if (!marketData) return;

      marketData.forEach((marketOdds: any) => {
        const pick = marketOdds.pick;
        if (!allOdds[pick] || marketOdds.odds > allOdds[pick].odds) {
          allOdds[pick] = {
            ...marketOdds,
            platform: platform.name,
            platformId: platform.id,
          };
        }
      });
    });

    setBestOdds(allOdds);
  }, [market]);

  const currentPlatform = BET_PLATFORMS.find((p) => p.id === selectedPlatform);
  const currentMarkets = currentPlatform?.markets[market as keyof typeof currentPlatform.markets] || [];

  const handlePlatformSelect = (platformId: string) => {
    setInternalSelectedPlatform(platformId);
    setIsOpen(false);
    onPlatformSelect?.(platformId);
  };

  const formatImpliedProbability = (odds: number) => ((1 / odds) * 100).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Betting Platform</label>
          {Object.keys(bestOdds).length > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Zap className="h-3 w-3" />
              <span>Best odds highlighted</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-4 py-3 border rounded-lg flex items-center justify-between hover:border-gray-400 bg-white transition-colors ${currentPlatform?.color || ""}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentPlatform?.logo}</span>
            <div>
              <div className="font-medium text-gray-900">{currentPlatform?.name}</div>
              <div className="text-sm text-gray-500">
                {currentMarkets.length} market{currentMarkets.length !== 1 ? "s" : ""} available
              </div>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {BET_PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handlePlatformSelect(platform.id)}
                className={`w-full p-3 flex items-center gap-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${selectedPlatform === platform.id ? "bg-blue-50" : ""}`}
              >
                <span className="text-2xl">{platform.logo}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{platform.name}</div>
                  <div className="text-sm text-gray-500">{Object.keys(platform.markets).length} market types</div>
                </div>
                {selectedPlatform === platform.id && <Check className="h-4 w-4 text-blue-600" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {market && currentMarkets.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-green-600" />
            <h4 className="font-medium text-gray-900">Available Odds on {currentPlatform?.name}</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentMarkets.map((marketOdds: any) => {
              const isBestOdds = bestOdds[marketOdds.pick]?.platformId === selectedPlatform;

              return (
                <button
                  key={marketOdds.pick}
                  type="button"
                  onClick={() => onOddsSelect(marketOdds.odds, currentPlatform?.name || "")}
                  className={`p-3 border rounded-lg text-left transition-all ${
                    isBestOdds
                      ? "border-green-500 bg-green-50 hover:bg-green-100"
                      : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-gray-900">{marketOdds.pick}</div>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${isBestOdds ? "text-green-700" : "text-gray-900"}`}>
                        {marketOdds.odds.toFixed(2)}
                      </span>
                      {isBestOdds && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Best</span>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Implied probability</span>
                    <span className="font-medium text-gray-700">
                      {marketOdds.impliedProbability ? `${marketOdds.impliedProbability.toFixed(1)}%` : `${formatImpliedProbability(marketOdds.odds)}%`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {Object.keys(bestOdds).length > 0 && (
            <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Best Odds Across All Platforms</span>
              </div>
              <div className="space-y-2">
                {Object.entries(bestOdds).map(([pick, data]: [string, any]) => (
                  <div key={pick} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{pick}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{data.odds.toFixed(2)}</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">{data.platform}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {market && currentMarkets.length === 0 && (
        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              {currentPlatform?.name} doesn't offer "{market}" markets. Try selecting a different platform or market type.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
