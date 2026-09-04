import { cn } from "@/lib/utils";

export function iconButtonClasses(active?: boolean, className?: string) {
  return cn(
    "relative flex h-10 w-10 items-center justify-center rounded-full text-ivory/80 transition-colors duration-200 hover:text-accent hover:bg-white/5",
    active && "text-accent",
    className
  );
}

export function IconCount({ count }: { count?: number }) {
  if (typeof count !== "number" || count <= 0) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-ink">
      {count}
    </span>
  );
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  count?: number;
  active?: boolean;
}

export function IconButton({
  className,
  count,
  active,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button className={iconButtonClasses(active, className)} {...props}>
      {children}
      <IconCount count={count} />
    </button>
  );
}
