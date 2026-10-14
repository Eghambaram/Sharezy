"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { COUNTRY_OPTIONS, flagEmoji } from "@/lib/countries";
import { callingCode, isCountryCode, splitE164, toE164, type CountryCode } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { controlClass } from "@/components/ui/input";

/**
 * Country code picker (default +91) + national number, emitting E.164.
 * The picker is a real <select> (keyboard and screen-reader friendly) under a
 * compact "flag +91" face, matching the reference board.
 */
export function PhoneField({
  id,
  value,
  onChange,
  onBlur,
  invalid,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (e164: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const initial = splitE164(value);
  const [country, setCountry] = useState<CountryCode>(initial.country);
  const [national, setNational] = useState(initial.national);

  const emit = (c: CountryCode, n: string) => onChange(toE164(c, n));

  return (
    <div className="flex gap-2">
      <span
        className={cn(
          "relative inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] border border-input bg-card px-3 text-base",
          "focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-ring",
        )}
      >
        <span aria-hidden="true">{flagEmoji(country)}</span>
        <span aria-hidden="true" className="tabular">
          {callingCode(country)}
        </span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
        <select
          aria-label="Country code"
          className="absolute inset-0 cursor-pointer opacity-0"
          value={country}
          onChange={(e) => {
            if (!isCountryCode(e.target.value)) return;
            setCountry(e.target.value);
            emit(e.target.value, national);
          }}
          onBlur={onBlur}
        >
          {COUNTRY_OPTIONS.map((c) =>
            isCountryCode(c.code) ? (
              <option key={c.code} value={c.code}>
                {c.name} ({callingCode(c.code)})
              </option>
            ) : null,
          )}
        </select>
      </span>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        className={cn(controlClass, "flex-1 tabular")}
        value={national}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        placeholder="98765 43210"
        onChange={(e) => {
          const raw = e.target.value;
          // A pasted international number (+44 …) also switches the country.
          if (raw.trim().startsWith("+")) {
            const split = splitE164(toE164(country, raw));
            if (split.national) {
              setCountry(split.country);
              setNational(split.national);
              emit(split.country, split.national);
              return;
            }
          }
          setNational(raw);
          emit(country, raw);
        }}
        onBlur={onBlur}
      />
    </div>
  );
}
