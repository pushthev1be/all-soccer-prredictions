'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, Home, LayoutDashboard, BarChart3 } from "lucide-react";

const navItems = [
  {
    label: "Home",
    href: "/",
    icon: Home,
    match: (path: string) => path === "/",
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    match: (path: string) => path.startsWith("/dashboard"),
  },
  {
    label: "Predictions",
    href: "/predictions",
    icon: BarChart3,
    match: (path: string) => path.startsWith("/predictions"),
  },
  {
    label: "Real Data",
    href: "/real-data",
    icon: Database,
    match: (path: string) => path.startsWith("/real-data"),
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="Primary">
      {navItems.map((item) => {
        const isActive = item.match(pathname);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="mobile-nav-item"
            data-active={isActive ? "true" : "false"}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="mobile-nav-icon" aria-hidden="true" />
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
