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

  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-300 p-12 text-center shadow-sm",
        "bg-gray-50 backdrop-blur-sm"
      )}
    >
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white border-2 border-gray-300 mb-6 shadow-lg">
        <Icon className="h-8 w-8 text-black" />
      </div>
      <h3 className="text-xl font-semibold text-black mb-2">{title}</h3>
      <p className="text-gray-600 max-w-md mx-auto mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={cn(
            "inline-flex items-center gap-2 px-6 py-3 rounded-xl",
            "bg-black text-white font-semibold",
            "hover:bg-gray-900",
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
