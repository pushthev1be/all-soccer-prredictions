"use client";

import { memo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusColors } from "@/lib/tokens";

type LegacyStatus = "pending" | "processing" | "completed" | "failed";
export type PredictionStatus = LegacyStatus | "live" | "won" | "lost" | "void";

interface PredictionCardProps {
  prediction: {
    id: string;
    homeTeam?: string;
    awayTeam?: string;
    league?: string;
    competition?: string;
    market: string;
    pick: string;
    odds?: number | null;
    stake?: number;
    potentialWin?: number;
    status: PredictionStatus;
    reasoning?: string;
    startTime?: Date | string;
  };
  variant?: "default" | "compact" | "detailed";
  onClick?: () => void;
}

function normalizeStatus(status: PredictionStatus): {
  label: string;
  colorClass: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
  Icon: (props: { className?: string }) => ReactNode;
} {
  switch (status) {
    case "completed":
    case "won":
      return { 
        label: "Won", 
        colorClass: "text-emerald-700", 
        badgeVariant: "default", 
        Icon: (p) => <CheckCircle2 className={cn(p.className, "text-emerald-600")} /> 
      };
    case "failed":
    case "lost":
      return { 
        label: "Lost", 
        colorClass: "text-rose-700", 
        badgeVariant: "destructive", 
        Icon: (p) => <TrendingDown className={cn(p.className, "text-rose-600")} /> 
      };
    case "processing":
    case "live":
      return { 
        label: "Live", 
        colorClass: "text-blue-700", 
        badgeVariant: "default", 
        Icon: (p) => <Clock className={cn(p.className, "text-blue-600")} /> 
      };
    case "void":
      return { label: "Void", colorClass: "text-gray-700", badgeVariant: "outline", Icon: (p) => <Clock className={cn(p.className, "text-gray-600")} /> };
    case "pending":
    default:
      return { 
        label: "Pending", 
        colorClass: "text-slate-700", 
        badgeVariant: "secondary", 
        Icon: (p) => <Clock className={cn(p.className, "text-slate-600")} /> 
      };
  }
}

export function PredictionCard({ prediction, variant = "default", onClick }: PredictionCardProps) {
  const { label, badgeVariant, Icon, colorClass } = normalizeStatus(prediction.status);
  const startTime = prediction.startTime ? new Date(prediction.startTime) : null;
  const hasRoi = typeof prediction.stake === "number" && typeof prediction.potentialWin === "number";
  const roi = hasRoi && prediction.stake! > 0 ? ((prediction.potentialWin! - prediction.stake!) / prediction.stake!) * 100 : null;

  const statusGradients: Record<PredictionStatus, string> = {
    completed: "from-emerald-50 to-green-100 border-emerald-400 shadow-emerald-100",
    won: "from-emerald-50 to-green-100 border-emerald-400 shadow-emerald-100",
    failed: "from-rose-50 to-red-100 border-rose-400 shadow-rose-100",
    lost: "from-rose-50 to-red-100 border-rose-400 shadow-rose-100",
    processing: "from-blue-50 to-indigo-100 border-blue-400 shadow-blue-100",
    live: "from-amber-50 to-yellow-100 border-amber-400 shadow-amber-100",
    pending: "from-slate-50 to-gray-100 border-slate-300 shadow-slate-100",
    void: "from-gray-100 to-gray-200 border-gray-400 shadow-gray-100",
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 shadow-sm",
        "hover:shadow-2xl hover:-translate-y-1",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/0 before:to-white/10",
        "before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100",
        "border-2",
        statusGradients[prediction.status],
        "bg-gradient-to-br",
        onClick && "cursor-pointer active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Shimmer effect for processing status */}
      {prediction.status === "processing" && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      )}
      <CardHeader className={cn("pb-4 relative z-10", variant === "compact" && "p-0 pb-2") }>
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-2 flex-1">
            <CardTitle className="text-lg font-bold text-black">
              {prediction.homeTeam && prediction.awayTeam ? (
                <span>
                  {prediction.homeTeam} vs {prediction.awayTeam}
                </span>
              ) : (
                <span>{prediction.market}</span>
              )}
            </CardTitle>
            {(prediction.league || prediction.competition || startTime) && (
              <p className="text-xs font-medium text-gray-600">
                {[prediction.league || prediction.competition, startTime ? startTime.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : null]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Icon className={cn("h-6 w-6", colorClass)} />
            <Badge variant={badgeVariant} className="font-semibold text-xs">{label}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("space-y-4 relative z-10", variant === "compact" && "p-0") }>
        {/* Prediction Details */}
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="font-semibold text-xs bg-gray-100 text-black border-gray-300">
            {prediction.market}
          </Badge>
          <Badge className="font-bold text-xs bg-black text-white">
            {prediction.pick}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 py-3 bg-white border-2 border-gray-200 rounded-lg px-3 shadow-sm">
          {typeof prediction.odds === "number" && (
            <div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Odds</p>
              <p className="text-lg font-extrabold text-gray-900">{prediction.odds.toFixed(2)}</p>
            </div>
          )}
          {typeof prediction.stake === "number" && (
            <div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Stake</p>
              <p className="text-lg font-extrabold text-gray-900">${prediction.stake}</p>
            </div>
          )}
          {roi !== null && (
            <div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">ROI</p>
              <p className={cn("text-lg font-extrabold", roi > 0 ? "text-emerald-600" : "text-rose-600")}>
                {roi > 0 ? "+" : ""}{roi.toFixed(1)}%
              </p>
            </div>
          )}
        </div>

        {/* Reasoning */}
        {(variant === "default" || variant === "detailed") && prediction.reasoning && (
          <p className="text-sm text-gray-800 line-clamp-2 font-medium leading-relaxed">{prediction.reasoning}</p>
        )}

          {variant === "detailed" && typeof prediction.stake === "number" && typeof prediction.potentialWin === "number" && (
            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200">
              <div className="text-center">
                <div className="text-sm text-gray-600">Stake</div>
                <div className="font-semibold text-black">${prediction.stake.toFixed(2)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Potential</div>
                <div className="font-semibold text-black">${prediction.potentialWin.toFixed(2)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Profit</div>
                <div className="font-semibold text-black">
                  ${(prediction.potentialWin - prediction.stake).toFixed(2)}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <Button variant="ghost" asChild>
              <a href={`/predictions/${prediction.id}`}>View Details</a>
            </Button>
            <span className="text-xs text-muted-foreground">
              {prediction.status === "processing" && "Analyzing..."}
              {prediction.status === "pending" && "Queued for analysis"}
            </span>
          </div>
        </CardContent>
    </Card>
  );
}

export const PredictionCardMemoized = memo(PredictionCard);
