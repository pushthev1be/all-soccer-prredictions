"use client";

import Image from "next/image";
import { useState } from "react";
import { getTeamBadgeUrl } from "@/lib/team-badges";

interface TeamBadgeProps {
  teamName: string;
  size?: "sm" | "md" | "lg" | "xl";
  showName?: boolean;
  className?: string;
}

const sizeClasses: Record<NonNullable<TeamBadgeProps["size"]>, string> = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-20 h-20",
};

const textSizes: Record<NonNullable<TeamBadgeProps["size"]>, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
};

export function TeamBadge({ teamName, size = "md", showName = false, className = "" }: TeamBadgeProps) {
  const [errored, setErrored] = useState(false);
  const badgeUrl = getTeamBadgeUrl(teamName);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 border border-gray-300 flex items-center justify-center`}>
        {!errored && badgeUrl ? (
          <Image
            src={badgeUrl}
            alt={`${teamName} badge`}
            fill
            className="object-cover p-1"
            onError={() => setErrored(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <span className="font-bold text-gray-700 text-xs">
              {teamName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      {showName && <span className={`font-medium text-gray-900 ${textSizes[size]}`}>{teamName}</span>}
    </div>
  );
}
