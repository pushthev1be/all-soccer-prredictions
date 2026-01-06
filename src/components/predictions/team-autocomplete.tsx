'use client';
import { useState, useMemo } from "react";
import { Search } from "lucide-react";

const TEAMS = [
  "Arsenal",
  "Aston Villa",
  "Bournemouth",
  "Brentford",
  "Brighton",
  "Chelsea",
  "Crystal Palace",
  "Everton",
  "Fulham",
  "Leeds United",
  "Leicester City",
  "Liverpool",
  "Manchester City",
  "Manchester United",
  "Newcastle United",
  "Nottingham Forest",
  "Southampton",
  "Tottenham",
  "West Ham",
  "Wolves",
  "Real Madrid",
  "Barcelona",
  "Atletico Madrid",
  "Sevilla",
  "Valencia",
  "Real Betis",
  "Real Sociedad",
  "Athletic Bilbao",
  "Villarreal",
  "AC Milan",
  "Inter Milan",
  "Juventus",
  "Napoli",
  "Roma",
  "Lazio",
  "Atalanta",
  "Fiorentina",
  "Bayern Munich",
  "Borussia Dortmund",
  "RB Leipzig",
  "Bayer Leverkusen",
  "Eintracht Frankfurt",
  "Wolfsburg",
  "PSG",
  "Benfica",
  "Porto",
  "Ajax",
  "Club Brugge",
];

const COMPETITIONS = [
  "Premier League",
  "Champions League",
  "Europa League",
  "FA Cup",
  "Carabao Cup",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
  "MLS",
  "World Cup",
  "Euro 2024",
  "Copa America",
];

interface TeamAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "team" | "competition";
  className?: string;
}

export function TeamAutocomplete({ value, onChange, placeholder, type = "team", className = "" }: TeamAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const suggestions = useMemo(() => {
    const data = type === "team" ? TEAMS : COMPETITIONS;
    if (!inputValue.trim()) return data.slice(0, 10);
    return data
      .filter((item) => item.toLowerCase().includes(inputValue.toLowerCase()))
      .slice(0, 10);
  }, [inputValue, type]);

  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue);
    onChange(selectedValue);
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setShowSuggestions(true);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setIsFocused(false);
              setShowSuggestions(false);
            }, 200);
          }}
          placeholder={placeholder || `Start typing ${type} name...`}
          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && isFocused && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((item) => (
            <div
              key={item}
              onMouseDown={() => handleSelect(item)}
              className="px-3 py-2.5 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{item}</div>
              {type === "team" && (
                <div className="text-xs text-gray-500 mt-0.5">
                  {item.includes("United") || item.includes("City")
                    ? "Premier League"
                    : item.includes("Madrid") || item.includes("Barcelona")
                    ? "La Liga"
                    : item.includes("Munich") || item.includes("Dortmund")
                    ? "Bundesliga"
                    : item.includes("Milan") || item.includes("Juventus")
                    ? "Serie A"
                    : "Top Division"}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
