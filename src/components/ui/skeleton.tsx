import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-300 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]",
        className
      )}
      {...props}
    />
  );
}
