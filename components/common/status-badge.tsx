import { cn } from "@/lib/utils";

const labels = {
  scheduled: "Запланирована",
  completed: "Завершена",
  cancelled: "Отменена"
} as const;

const styles = {
  scheduled: "bg-accent text-accent-foreground",
  completed: "bg-muted text-foreground",
  cancelled: "bg-destructive/10 text-destructive"
} as const;

export function StatusBadge({ status }: { status: keyof typeof labels }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", styles[status])}>
      {labels[status]}
    </span>
  );
}
