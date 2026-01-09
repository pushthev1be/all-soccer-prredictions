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
        colorClass: "text-green-500", 
        badgeVariant: "default", 
        Icon: (p) => <CheckCircle2 className={p.className} style={{ color: statusColors.completed }} /> 
      };
    case "failed":
    case "lost":
      return { 
        label: "Lost", 
        colorClass: "text-red-500", 
        badgeVariant: "destructive", 
        Icon: (p) => <TrendingDown className={p.className} style={{ color: statusColors.failed }} /> 
      };
    case "processing":
    case "live":
      return { 
        label: "Live", 
        colorClass: "text-blue-500", 
        badgeVariant: "default", 
        Icon: (p) => <Clock className={p.className} style={{ color: statusColors.processing }} /> 
      };
    case "void":
      return { label: "Void", colorClass: "text-gray-500", badgeVariant: "outline", Icon: (p) => <Clock className={p.className} /> };
    case "pending":
    default:
      return { 
        label: "Pending", 
        colorClass: "text-yellow-500", 
        badgeVariant: "secondary", 
        Icon: (p) => <Clock className={p.className} style={{ color: statusColors.pending }} /> 
      };
  }
}

export function PredictionCard({ prediction, variant = "default", onClick }: PredictionCardProps) {
  const { label, badgeVariant, Icon, colorClass } = normalizeStatus(prediction.status);
  const startTime = prediction.startTime ? new Date(prediction.startTime) : null;
  const hasRoi = typeof prediction.stake === "number" && typeof prediction.potentialWin === "number";
  const roi = hasRoi && prediction.stake! > 0 ? ((prediction.potentialWin! - prediction.stake!) / prediction.stake!) * 100 : null;

  const statusGradients: Record<PredictionStatus, string> = {
    completed: "from-emerald-500/20 to-emerald-600/20 border-emerald-200",
    won: "from-emerald-500/20 to-emerald-600/20 border-emerald-200",
    failed: "from-red-500/20 to-red-600/20 border-red-200",
    lost: "from-red-500/20 to-red-600/20 border-red-200",
    processing: "from-cyan-500/20 to-cyan-600/20 border-cyan-200",
    live: "from-cyan-500/20 to-cyan-600/20 border-cyan-200",
    pending: "from-amber-500/20 to-amber-600/20 border-amber-200",
    void: "from-slate-500/20 to-slate-600/20 border-slate-200",
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:shadow-2xl hover:-translate-y-1",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/0 before:to-white/10",
        "before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100",
        "border-2",
        statusGradients[prediction.status],
        "bg-gradient-to-br",
        onClick && "cursor-pointer",
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
            <CardTitle className="text-lg font-bold text-slate-900">
              {prediction.homeTeam && prediction.awayTeam ? (
                <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  {prediction.homeTeam} vs {prediction.awayTeam}
                </span>
              ) : (
                <span>{prediction.market}</span>
              )}
            </CardTitle>
            {(prediction.league || prediction.competition || startTime) && (
              <p className="text-xs font-medium text-slate-600">
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
          <Badge variant="outline" className="font-semibold text-xs bg-slate-100 text-slate-700">
            {prediction.market}
          </Badge>
          <Badge className="font-bold text-xs bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
            {prediction.pick}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 py-3 bg-white/50 rounded-lg px-3">
          {typeof prediction.odds === "number" && (
            <div>
              <p className="text-xs font-medium text-slate-600">Odds</p>
              <p className="text-lg font-bold text-emerald-600">{prediction.odds.toFixed(2)}</p>
            </div>
          )}
          {typeof prediction.stake === "number" && (
            <div>
              <p className="text-xs font-medium text-slate-600">Stake</p>
              <p className="text-lg font-bold text-slate-900">${prediction.stake}</p>
            </div>
          )}
          {roi !== null && (
            <div>
              <p className="text-xs font-medium text-slate-600">ROI</p>
              <p className={cn("text-lg font-bold", roi > 0 ? "text-emerald-600" : "text-red-600")}>
                {roi > 0 ? "+" : ""}{roi.toFixed(1)}%
              </p>
            </div>
          )}
        </div>

        {/* Reasoning */}
        {(variant === "default" || variant === "detailed") && prediction.reasoning && (
          <p className="text-sm text-slate-700 line-clamp-2 font-medium">{prediction.reasoning}</p>
        )}

          {variant === "detailed" && typeof prediction.stake === "number" && typeof prediction.potentialWin === "number" && (
            <div className="grid grid-cols-3 gap-4 pt-3 border-t">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Stake</div>
                <div className="font-semibold">${prediction.stake.toFixed(2)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Potential</div>
                <div className="font-semibold text-green-600">${prediction.potentialWin.toFixed(2)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Profit</div>
                <div className={cn(
                  "font-semibold",
                  prediction.potentialWin - prediction.stake > 0 ? "text-green-600" : "text-red-600"
                )}>
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
