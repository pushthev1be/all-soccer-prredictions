'use client';
import { useState } from "react";
import { ChevronDown, Calendar, Trophy, Search, Check } from "lucide-react";

const COMPETITIONS_WITH_FIXTURES = [
  {
    id: "premier-league",
    name: "Premier League",
    country: "England",
    icon: "🏴",
    fixtures: [
      { id: "1", home: "Chelsea", away: "Manchester City", date: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), venue: "Stamford Bridge" },
      { id: "2", home: "Liverpool", away: "Arsenal", date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), venue: "Anfield" },
      { id: "3", home: "Manchester United", away: "Tottenham", date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), venue: "Old Trafford" },
    ],
  },
  {
    id: "champions-league",
    name: "Champions League",
    country: "Europe",
    icon: "🏆",
    fixtures: [
      { id: "4", home: "Real Madrid", away: "Bayern Munich", date: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), venue: "Santiago Bernabeu" },
      { id: "5", home: "Barcelona", away: "PSG", date: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(), venue: "Camp Nou" },
    ],
  },
  {
    id: "la-liga",
    name: "La Liga",
    country: "Spain",
    icon: "🇪🇸",
    fixtures: [
      { id: "6", home: "Real Madrid", away: "Barcelona", date: new Date(Date.now() + 120 * 60 * 60 * 1000).toISOString(), venue: "Santiago Bernabeu" },
    ],
  },
];

interface CompetitionSelectorProps {
  value: string;
  onChange: (competition: string, canonicalId: string) => void;
  onMatchSelect?: (match: {
    competition: string;
    canonicalCompetitionId: string;
    homeTeam: string;
    canonicalHomeTeamId: string;
    awayTeam: string;
    canonicalAwayTeamId: string;
    kickoffTimeUTC: string;
  }) => void;
  className?: string;
}

export function CompetitionSelector({ value, onChange, onMatchSelect, className = "" }: CompetitionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCompetition, setSelectedCompetition] = useState<any>(null);

  const filteredCompetitions = COMPETITIONS_WITH_FIXTURES.filter(
    (comp) =>
      comp.name.toLowerCase().includes(search.toLowerCase()) ||
      comp.country.toLowerCase().includes(search.toLowerCase())
  );

  const handleCompetitionSelect = (competition: (typeof COMPETITIONS_WITH_FIXTURES)[number]) => {
    setSelectedCompetition(competition);
    onChange(competition.name, `custom:${competition.id}`);
    setSearch("");
  };

  const handleMatchSelect = (match: { id: string; home: string; away: string; date: string; venue: string }) => {
    if (!selectedCompetition || !onMatchSelect) return;

    onMatchSelect({
      competition: selectedCompetition.name,
      canonicalCompetitionId: `custom:${selectedCompetition.id}`,
      homeTeam: match.home,
      canonicalHomeTeamId: `custom:${match.home.toLowerCase().replace(/\s+/g, "-")}`,
      awayTeam: match.away,
      canonicalAwayTeamId: `custom:${match.away.toLowerCase().replace(/\s+/g, "-")}`,
      kickoffTimeUTC: match.date,
    });
    setIsOpen(false);
  };

  const formatMatchTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (diffHours < 24) return `Today, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    if (diffHours < 48) return `Tomorrow, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg flex items-center justify-between hover:border-gray-400 bg-white transition-colors"
      >
        <div className="flex items-center gap-3">
          <Trophy className="h-5 w-5 text-gray-400" />
          <span className={value ? "text-gray-900 font-medium" : "text-gray-500"}>{value || "Select competition..."}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-hidden">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search competitions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-80">
            {filteredCompetitions.map((competition) => (
              <div key={competition.id} className="border-b border-gray-100 last:border-b-0">
                <div
                  onClick={() => handleCompetitionSelect(competition)}
                  className={`p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between transition-colors ${
                    selectedCompetition?.id === competition.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{competition.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{competition.name}</div>
                      <div className="text-sm text-gray-500">{competition.country}</div>
                    </div>
                  </div>
                  {selectedCompetition?.id === competition.id ? (
                    <Check className="h-4 w-4 text-blue-600" />
                  ) : (
                    <div className="text-sm text-gray-500">
                      {competition.fixtures.length} match{competition.fixtures.length !== 1 ? "es" : ""}
                    </div>
                  )}
                </div>

                {selectedCompetition?.id === competition.id && (
                  <div className="bg-blue-50 border-t border-blue-100">
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Upcoming Matches</span>
                      </div>
                      <div className="space-y-2">
                        {competition.fixtures.map((match) => (
                          <button
                            key={match.id}
                            onClick={() => handleMatchSelect(match)}
                            className="w-full p-3 bg-white border border-gray-200 rounded text-left hover:bg-blue-100 hover:border-blue-300 transition-colors"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <div className="font-medium text-gray-900">
                                {match.home} vs {match.away}
                              </div>
                              <div className="text-sm text-blue-600 font-medium">Select</div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-xs text-gray-500">{match.venue}</div>
                              <div className="text-xs text-gray-600">{formatMatchTime(match.date)}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredCompetitions.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-600">No competitions found</p>
              <p className="text-sm text-gray-500 mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
