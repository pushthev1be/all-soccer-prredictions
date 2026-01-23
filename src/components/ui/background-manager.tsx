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
    <div className="background-root" aria-hidden>
      {/* Background image */}
      <Image
        src={src}
        alt="Page background"
        fill
        priority={pathname === "/" || pathname.startsWith("/dashboard")}
        className="background-image"
        sizes="100vw"
      />
      {/* Blending overlay & subtle vignette for text readability */}
      <div className="background-overlay" />
      <div className="background-vignette" />
    </div>
  );
}
