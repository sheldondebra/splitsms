"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<React.ComponentProps<"input">, "type"> & {
  indeterminate?: boolean;
};

export function Checkbox({
  className,
  checked,
  indeterminate,
  disabled,
  ...props
}: CheckboxProps) {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = Boolean(indeterminate);
    }
  }, [indeterminate]);

  const isOn = Boolean(checked) || Boolean(indeterminate);

  return (
    <label
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center justify-center",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        className="sr-only"
        {...props}
      />
      <span
        aria-hidden
        className={cn(
          "flex h-[18px] w-[18px] items-center justify-center rounded-md border-2 transition-all duration-150",
          isOn
            ? "border-primary bg-primary shadow-sm shadow-primary/20"
            : "border-border/80 bg-background hover:border-primary/40 hover:bg-muted/40",
        )}
      >
        {indeterminate ? (
          <Minus className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
        ) : (
          <Check
            className={cn(
              "h-3 w-3 text-primary-foreground transition-all duration-150",
              checked ? "scale-100 opacity-100" : "scale-75 opacity-0",
            )}
            strokeWidth={3}
          />
        )}
      </span>
    </label>
  );
}
