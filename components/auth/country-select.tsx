"use client";

import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import type { SignupCountryOption } from "@/lib/signup-countries";
import { cn } from "@/lib/utils";

type CountrySelectProps = {
  countries: SignupCountryOption[];
  value: string;
  onChange: (code: string, country: SignupCountryOption) => void;
};

export function CountrySelect({ countries, value, onChange }: CountrySelectProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, SignupCountryOption[]>();
    for (const c of countries) {
      const region = c.region ?? "Other";
      if (!map.has(region)) map.set(region, []);
      map.get(region)!.push(c);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [countries]);

  return (
    <div className="space-y-2">
      <Label htmlFor="countryCode">Country / region</Label>
      <select
        id="countryCode"
        name="countryCode"
        value={value}
        onChange={(e) => {
          const c = countries.find((x) => x.code === e.target.value);
          if (c) onChange(c.code, c);
        }}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 outline-none",
        )}
        required
      >
        {grouped.map(([region, list]) => (
          <optgroup key={region} label={region}>
            {list.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.dialCode})
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
