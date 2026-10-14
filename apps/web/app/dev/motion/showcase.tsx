"use client";

import { MotionConfig } from "motion/react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Mail, MapPin, Phone, User } from "lucide-react";
import { SESSION_STATUSES } from "@dx/shared";
import {
  AnimatedNumberText,
  BottomSheet,
  CountdownRing,
  CountUp,
  FadeIn,
  PressScale,
  Shake,
  Skeleton,
  SlideStep,
  Stagger,
  StatusPulse,
  SuccessCheck,
  type StepDirection,
} from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";

type Mode = "user" | "always";

export function MotionShowcase() {
  const [mode, setMode] = useState<Mode>("user");
  const [replay, setReplay] = useState(0);

  return (
    <MotionConfig reducedMotion={mode}>
      <main className="mx-auto max-w-5xl px-4 py-8" data-reduced-motion={mode === "always" ? "true" : undefined}>
        <Link href="/dev" className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> Developer tools
        </Link>
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Motion primitives</h1>
            <p className="text-sm text-muted-foreground">Development only. Every primitive in `components/motion/`.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <fieldset className="inline-flex rounded-[var(--radius-control)] border p-1">
              <legend className="sr-only">Motion mode</legend>
              {(["user", "always"] as const).map((m) => (
                <label
                  key={m}
                  className={cn(
                    "inline-flex min-h-9 cursor-pointer items-center rounded-[10px] px-3 text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
                    mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} className="sr-only" />
                  {m === "user" ? "Full motion (follows OS)" : "Reduced motion"}
                </label>
              ))}
            </fieldset>
            <Button variant="outline" size="sm" onClick={() => setReplay((n) => n + 1)}>
              Replay
            </Button>
          </div>
        </header>

        <div key={`${mode}-${replay}`} className="grid gap-4 md:grid-cols-2">
          <Demo title="FadeIn" note="opacity + 8 px rise · reduced: opacity only">
            <FadeIn className="rounded-[var(--radius-control)] bg-primary-soft p-4 text-sm">Request details loaded.</FadeIn>
          </Demo>

          <Demo title="SlideStep" note="direction-aware; Back reverses · reduced: 150 ms fade">
            <SlideStepDemo />
          </Demo>

          <Demo title="Stagger" note="35 ms apart, capped at 8 items · reduced: no stagger">
            <Stagger as="ul" itemAs="li" className="space-y-2">
              {["Full name", "Mobile number", "Email address", "Postal address"].map((f) => (
                <span key={f} className="block rounded-[var(--radius-control)] border px-3 py-2 text-sm">
                  {f}
                </span>
              ))}
            </Stagger>
          </Demo>

          <Demo title="PressScale" note="whileTap scale 0.98 · reduced: none">
            <PressScale className="inline-block">
              <Button variant="primary" size="lg">
                Press me
              </Button>
            </PressScale>
          </Demo>

          <Demo title="Shake" note="error-triggered · reduced: none (error text still shows)">
            <ShakeDemo />
          </Demo>

          <Demo title="CountUp" note="0 → value in 600 ms, once · reduced: final value">
            <div className="flex gap-6">
              {[
                { label: "Total", v: 12 },
                { label: "Completed", v: 8 },
                { label: "Pending", v: 3 },
              ].map((s) => (
                <div key={s.label}>
                  <CountUp value={s.v} className="text-2xl font-semibold" />
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </Demo>

          <Demo title="CountdownRing" note="amber ≤ 60 s, red ≤ 15 s · reduced: static ring">
            <CountdownDemo />
          </Demo>

          <Demo title="StatusPulse + status pills" note="2 s loop, pauses when tab hidden · reduced: static dot">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 text-sm">
                <StatusPulse /> Waiting for customer
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SESSION_STATUSES.map((s) => (
                <StatusPill key={s} status={s} />
              ))}
            </div>
          </Demo>

          <Demo title="SuccessCheck" note="pop + path draw + one particle burst · reduced: static">
            <div className="flex items-center gap-8">
              <SuccessCheck label="Information shared successfully" />
              <div className="text-center">
                <SuccessCheck size={48} particles={false} label="Information received" />
                <p className="mt-1 text-xs text-muted-foreground">Portal (no particles)</p>
              </div>
            </div>
          </Demo>

          <Demo title="BottomSheet" note="slide up (gentle), drag/Esc to dismiss · reduced: fade">
            <SheetDemo />
          </Demo>

          <Demo title="Skeleton" note="1.4 s shimmer · reduced: static">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </Demo>

          <Demo title="AnimatedNumberText" note="number rolls up/down · reduced: instant">
            <NumberTextDemo />
          </Demo>
        </div>
      </main>
    </MotionConfig>
  );
}

function Demo({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="font-mono text-sm font-semibold">{title}</h2>
      <p className="mb-4 text-xs text-muted-foreground">{note}</p>
      {children}
    </Card>
  );
}

function SlideStepDemo() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<StepDirection>(1);
  const steps = ["Details", "Select fields", "Share method"];
  const go = (d: StepDirection) => {
    setDir(d);
    setStep((s) => Math.min(steps.length - 1, Math.max(0, s + d)));
  };
  return (
    <div className="space-y-3">
      <SlideStep stepKey={step} direction={dir} className="min-h-14 overflow-hidden">
        <div className="rounded-[var(--radius-control)] bg-surface-2 p-4 text-sm">
          Step {step + 1}: {steps[step]}
        </div>
      </SlideStep>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => go(-1)} disabled={step === 0}>
          Back
        </Button>
        <Button size="sm" onClick={() => go(1)} disabled={step === steps.length - 1}>
          Next
        </Button>
      </div>
    </div>
  );
}

function ShakeDemo() {
  const [errors, setErrors] = useState(0);
  return (
    <div className="space-y-2">
      <Shake trigger={errors} className="flex gap-2">
        {"482917".split("").map((d, i) => (
          <span
            key={i}
            className={cn(
              "inline-flex size-11 items-center justify-center rounded-[var(--radius-control)] border text-lg font-semibold tabular",
              errors > 0 && "border-destructive",
            )}
          >
            {d}
          </span>
        ))}
      </Shake>
      <p className="min-h-5 text-sm text-destructive" aria-live="assertive">
        {errors > 0 ? "That code didn't work. Check it and try again." : ""}
      </p>
      <Button variant="outline" size="sm" onClick={() => setErrors((n) => n + 1)}>
        Submit wrong code
      </Button>
    </div>
  );
}

function CountdownDemo() {
  // Fixed epoch so server and client render alike; reset buttons set a live deadline.
  const [deadline, setDeadline] = useState(() => new Date(0));
  useEffect(() => {
    const t = window.setTimeout(() => setDeadline(new Date(Date.now() + 75_000)), 0);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="flex flex-wrap items-center gap-4">
      <CountdownRing expiresAt={deadline} totalSeconds={75} label="Request expires in" />
      <Button variant="outline" size="sm" onClick={() => setDeadline(new Date(Date.now() + 75_000))}>
        Reset (75 s)
      </Button>
      <Button variant="outline" size="sm" onClick={() => setDeadline(new Date(Date.now() + 20_000))}>
        20 s
      </Button>
    </div>
  );
}

function SheetDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Decline request…
      </Button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Decline this request?"
        description="Maple Grove Properties won't receive any of your information."
      >
        <div className="grid gap-2">
          <Button variant="primary" block onClick={() => setOpen(false)}>
            Decline request
          </Button>
          <Button variant="outline" block onClick={() => setOpen(false)}>
            Go back
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}

function NumberTextDemo() {
  const fields = [
    { icon: User, label: "Full name", required: true },
    { icon: Phone, label: "Mobile number", required: true },
    { icon: Mail, label: "Email address", required: false },
    { icon: MapPin, label: "Postal address", required: false },
  ];
  // Optional fields default to off.
  const [on, setOn] = useState<boolean[]>(fields.map((f) => f.required));
  const count = on.filter(Boolean).length;
  return (
    <div className="space-y-3">
      <AnimatedNumberText value={count} total={fields.length} className="text-sm" />
      <ul className="space-y-1">
        {fields.map((f, i) => (
          <li key={f.label}>
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-[var(--accent-strong)]"
                checked={on[i] ?? false}
                disabled={f.required}
                onChange={(e) => setOn((prev) => prev.map((v, j) => (j === i ? e.target.checked : v)))}
              />
              <f.icon className="size-4 text-muted-foreground" aria-hidden="true" />
              {f.label}
              <span className="text-xs text-muted-foreground">{f.required ? "Required" : "Optional"}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
