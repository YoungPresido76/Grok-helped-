import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onValueChange: (value: number) => void;
  className?: string;
};

export function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onValueChange,
  className,
}: SliderProps) {
  return (
    <label className={cn("flex min-w-0 flex-1 flex-col gap-1.5", className)}>
      <span className="flex items-baseline justify-between gap-3 text-xs font-medium">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums text-fg">{display}</span>
      </span>
      <SliderPrimitive.Root
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => onValueChange(next[0] ?? value)}
        className="relative flex h-11 w-full touch-none items-center"
        aria-label={label}
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-surface-2">
          <SliderPrimitive.Range className="absolute h-full bg-accent" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block size-4 rounded-full bg-fg shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40" />
      </SliderPrimitive.Root>
    </label>
  );
}
