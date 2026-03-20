import { getExpiryStatus } from "@/lib/forecasting";
import { cn } from "@/lib/utils";

interface ExpiryBadgeProps {
  expiryDate: string;
  className?: string;
}

export function ExpiryBadge({ expiryDate, className }: ExpiryBadgeProps) {
  const { status, label, emoji } = getExpiryStatus(expiryDate);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "expired" && "bg-destructive/10 text-destructive",
        status === "critical" && "bg-destructive/10 text-destructive",
        status === "warning" && "bg-warning/10 text-warning",
        status === "good" && "bg-success/10 text-success",
        className
      )}
    >
      {emoji} {label}
    </span>
  );
}
