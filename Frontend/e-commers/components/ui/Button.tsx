import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-ink hover:bg-accent-bright shadow-[0_0_0_1px_rgba(217,201,163,0.4)]",
  outline:
    "border border-line-strong text-ivory hover:border-accent hover:text-accent bg-transparent",
  ghost: "text-ivory/80 hover:text-accent bg-transparent",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-xs tracking-[0.18em]",
  md: "px-6 py-3 text-sm tracking-[0.18em]",
  lg: "px-8 py-4 text-sm tracking-[0.22em]",
};

const base =
  "inline-flex items-center justify-center gap-2 uppercase font-medium transition-colors duration-200 disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  );
}

type ButtonLinkProps = CommonProps &
  React.ComponentProps<typeof Link>;

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  );
}
