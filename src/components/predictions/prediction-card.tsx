"use client";

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
  Icon: (props: { className?: string }) => JSX.Element;
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

  return (
    <Card
      className={cn(
        "w-full transition-all hover:shadow-lg",
        onClick && "cursor-pointer",
        variant === "compact" && "p-4",
        variant === "detailed" && "border-2"
      )}
      onClick={onClick}
    >
      <CardHeader className={cn("pb-3", variant === "compact" && "p-0 pb-2") }>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {prediction.homeTeam && prediction.awayTeam ? (
                <span>
                  {prediction.homeTeam} vs {prediction.awayTeam}
                </span>
              ) : (
                <span>{prediction.market}</span>
              )}
            </CardTitle>
            {(prediction.league || prediction.competition || startTime) && (
              <p className="text-sm text-muted-foreground">
                {[prediction.league || prediction.competition, startTime ? startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Icon className={cn("h-4 w-4", colorClass)} />
            <Badge variant={badgeVariant}>{label}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn(variant === "compact" && "p-0") }>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-medium">
              {prediction.market}
            </Badge>
            <Badge variant="secondary" className="font-bold text-sm">
              {prediction.pick}
            </Badge>
            <div className="ml-auto flex items-center gap-4">
              {typeof prediction.odds === "number" && (
                <div className="text-right">
                  <div className="text-sm font-semibold text-green-600">
                    Odds: {prediction.odds.toFixed(2)}
                  </div>
                  {typeof prediction.stake === "number" && (
                    <div className="text-xs text-muted-foreground">Stake: ${prediction.stake}</div>
                  )}
                </div>
              )}
              {roi !== null && (
                <Badge variant="outline" className={cn("text-xs", roi > 0 ? "text-green-600" : "text-red-600") }>
                  {roi > 0 ? "+" : ""}{roi.toFixed(1)}%
                </Badge>
              )}
            </div>
          </div>

          {(variant === "default" || variant === "detailed") && prediction.reasoning && (
            <p className="text-sm text-foreground/80 line-clamp-2">{prediction.reasoning}</p>
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
            <Button variant="ghost" size="sm" asChild>
              <a href={`/predictions/${prediction.id}`}>View Details</a>
            </Button>
            <span className="text-xs text-muted-foreground">
              {prediction.status === "processing" && "Analyzing..."}
              {prediction.status === "pending" && "Queued for analysis"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
