import { cn } from "@/lib/utils";

type Tone = "accent" | "ivory" | "danger";

const toneClasses: Record<Tone, string> = {
  accent: "border-accent/50 text-accent",
  ivory: "border-line-strong text-ivory/80",
  danger: "border-danger/50 text-danger",
};

export function Badge({
  tone = "accent",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em]",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
