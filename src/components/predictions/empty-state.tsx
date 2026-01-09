import { Search, PlusCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  type?: "no-results" | "no-data" | "error";
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  type = "no-results",
}: EmptyStateProps) {
  const icons = {
    "no-results": Search,
    "no-data": PlusCircle,
    error: AlertCircle,
  };

  const Icon = icons[type];
  const gradients = {
    "no-results": "from-blue-500/20 to-cyan-500/20",
    "no-data": "from-emerald-500/20 to-teal-500/20",
    error: "from-rose-500/20 to-pink-500/20",
  };

  const iconColors = {
    "no-results": "text-blue-600",
    "no-data": "text-emerald-600",
    error: "text-rose-600",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/50 p-12 text-center",
        "bg-gradient-to-br",
        gradients[type],
        "backdrop-blur-sm"
      )}
    >
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/80 mb-6 shadow-lg">
        <Icon className={cn("h-8 w-8", iconColors[type])} />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 max-w-md mx-auto mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={cn(
            "inline-flex items-center gap-2 px-6 py-3 rounded-xl",
            "bg-gradient-to-r from-emerald-500 to-teal-600",
            "text-white font-semibold",
            "hover:from-emerald-600 hover:to-teal-700",
            "transition-all duration-200",
            "hover:scale-105 hover:shadow-lg",
            "active:scale-95"
          )}
        >
          <PlusCircle className="h-5 w-5" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
