type OddsResult = {
  market: string;
  pick: string;
  odds: number;
  source: string;
};

const defaultOdds: Record<string, OddsResult> = {
  "1X2:home": { market: "1X2", pick: "1", odds: 2.2, source: "sample-book" },
  "1X2:draw": { market: "1X2", pick: "X", odds: 3.4, source: "sample-book" },
  "1X2:away": { market: "1X2", pick: "2", odds: 3.1, source: "sample-book" },
};

export async function getQuickOdds(market: string, pick: string): Promise<OddsResult> {
  const key = `${market}:${pick}`;
  return defaultOdds[key] || { market, pick, odds: 2.0, source: "sample-book" };
}
