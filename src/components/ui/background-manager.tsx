"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

function pickBackground(pathname: string): string {
  // Map route prefixes to specific background images
  if (pathname === "/") return "/images/backgrounds/football-pattern.jpg";
  if (pathname.startsWith("/dashboard")) return "/images/backgrounds/stadium.jpg";
  if (pathname.startsWith("/predictions")) return "/images/backgrounds/stadium-aerial.jpg";
  if (pathname.startsWith("/real-data")) return "/images/backgrounds/stadium-aerial.jpg";
  if (pathname.startsWith("/auth")) return "/images/backgrounds/football-pattern.jpg";
  if (pathname.startsWith("/admin")) return "/images/backgrounds/stadium.jpg";
  return "/images/backgrounds/stadium-aerial.jpg";
}

export function BackgroundManager() {
  const pathname = usePathname() || "/";

  const src = useMemo(() => pickBackground(pathname), [pathname]);

  return (
    <>
      {/* Fixed background positioned behind all content */}
      <div className="fixed inset-0 -z-50 pointer-events-none overflow-hidden" aria-hidden="true">
        <Image
          src={src}
          alt="Page background"
          fill
          priority={pathname === "/" || pathname.startsWith("/dashboard")}
          className="w-full h-full object-cover"
          sizes="100vw"
        />
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/70 to-black/85" />
        {/* Vignette */}
        <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 200px rgba(0, 0, 0, 0.35)" }} />
      </div>
    </>
  );
}
