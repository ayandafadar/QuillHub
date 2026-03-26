import { cn } from "@/lib/utils";

type SpinnerSize = "xs" | "sm" | "md";

const dotSize: Record<SpinnerSize, string> = {
  xs: "size-1",
  sm: "size-1.5",
  md: "size-2.5",
};

const gapSize: Record<SpinnerSize, string> = {
  xs: "gap-1",
  sm: "gap-1.5",
  md: "gap-2",
};

interface SpinnerProps {
  size?: SpinnerSize;
  color?: string;
  className?: string;
}

function Spinner({ size = "md", color, className }: SpinnerProps) {
  const dot = cn(
    "rounded-full bg-current animate-bounce",
    dotSize[size],
    color ? "" : "text-zinc-400"
  );

  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("inline-flex items-end", gapSize[size], className)}
      style={color ? { color } : undefined}
    >
      <span className={dot} style={{ animationDelay: "0ms" }} />
      <span className={dot} style={{ animationDelay: "150ms" }} />
      <span className={dot} style={{ animationDelay: "300ms" }} />
    </span>
  );
}

export { Spinner };
