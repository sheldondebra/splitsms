"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { passwordStrength } from "@/lib/auth/validation";
import { cn } from "@/lib/utils";

type PasswordFieldProps = {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  showStrength?: boolean;
  autoComplete?: string;
};

export function PasswordField({
  id,
  name,
  label,
  required = true,
  showStrength = false,
  autoComplete = "new-password",
}: PasswordFieldProps) {
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);
  const strength = showStrength && value ? passwordStrength(value) : null;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          minLength={8}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="pr-10"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {showStrength && value && strength && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i <= strength.score ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Strength: {strength.label} · 8+ chars, upper, lower, number, symbol
          </p>
        </div>
      )}
    </div>
  );
}
