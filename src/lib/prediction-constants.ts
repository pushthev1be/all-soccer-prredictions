// Market options for prediction form validation
export const marketOptions: Record<string, { value: string; label: string }[]> = {
  "1X2": [
    { value: "home", label: "Home Win" },
    { value: "draw", label: "Draw" },
    { value: "away", label: "Away Win" },
  ],
  "double-chance": [
    { value: "home-draw", label: "Home or Draw" },
    { value: "home-away", label: "Home or Away" },
    { value: "draw-away", label: "Draw or Away" },
  ],
  "over-under": [
    { value: "over-0.5", label: "Over 0.5" },
    { value: "under-0.5", label: "Under 0.5" },
    { value: "over-1.5", label: "Over 1.5" },
    { value: "under-1.5", label: "Under 1.5" },
    { value: "over-2.5", label: "Over 2.5" },
    { value: "under-2.5", label: "Under 2.5" },
    { value: "over-3.5", label: "Over 3.5" },
    { value: "under-3.5", label: "Under 3.5" },
  ],
  "btts": [
    { value: "yes", label: "Both Teams to Score - Yes" },
    { value: "no", label: "Both Teams to Score - No" },
  ],
  "asian-handicap": [
    { value: "home-0.5", label: "Home -0.5" },
    { value: "away+0.5", label: "Away +0.5" },
    { value: "home-1", label: "Home -1" },
    { value: "away+1", label: "Away +1" },
    { value: "home-1.5", label: "Home -1.5" },
    { value: "away+1.5", label: "Away +1.5" },
  ],
  "correct-score": [
    { value: "1-0", label: "1-0" },
    { value: "2-0", label: "2-0" },
    { value: "2-1", label: "2-1" },
    { value: "3-0", label: "3-0" },
    { value: "3-1", label: "3-1" },
    { value: "3-2", label: "3-2" },
    { value: "0-0", label: "0-0" },
    { value: "1-1", label: "1-1" },
    { value: "2-2", label: "2-2" },
    { value: "0-1", label: "0-1" },
    { value: "0-2", label: "0-2" },
    { value: "1-2", label: "1-2" },
    { value: "0-3", label: "0-3" },
    { value: "1-3", label: "1-3" },
    { value: "2-3", label: "2-3" },
  ],
  "dnb": [
    { value: "home", label: "Draw No Bet - Home" },
    { value: "away", label: "Draw No Bet - Away" },
  ],
};

export const marketLabels: Record<string, string> = {
  "1X2": "Match Result (1X2)",
  "double-chance": "Double Chance",
  "over-under": "Over/Under Goals",
  "btts": "Both Teams to Score",
  "asian-handicap": "Asian Handicap",
  "correct-score": "Correct Score",
  "dnb": "Draw No Bet",
};
