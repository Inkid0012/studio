import { cn } from "@/lib/utils";

export function FizuLogo({ className }: { className?: string }) {
  return (
    <div className={cn("font-headline text-4xl font-bold text-primary", className)}>
      FIZU
    </div>
  );
}
