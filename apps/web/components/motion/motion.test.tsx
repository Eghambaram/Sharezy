import { render, screen } from "@testing-library/react";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import type { ReactNode } from "react";
import { SESSION_STATUSES, SESSION_STATUS_LABELS } from "@dx/shared";
import { StatusPill } from "@/components/ui/status-pill";
import { countdownAnnouncement, countdownTone, formatCountdown, secondsUntil } from "./countdown";
import { CountUp } from "./count-up";
import { staggerDelay } from "./stagger";
import { particleVectors, SuccessCheck } from "./success-check";

function Reduced({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="always">{children}</MotionConfig>
    </LazyMotion>
  );
}

describe("countdown helpers", () => {
  it("shifts tone at 60 s and 15 s", () => {
    expect(countdownTone(300)).toBe("ok");
    expect(countdownTone(61)).toBe("ok");
    expect(countdownTone(60)).toBe("warn");
    expect(countdownTone(16)).toBe("warn");
    expect(countdownTone(15)).toBe("danger");
    expect(countdownTone(0)).toBe("expired");
  });

  it("formats m:ss and never goes negative", () => {
    expect(formatCountdown(900)).toBe("15:00");
    expect(formatCountdown(299.2)).toBe("5:00");
    expect(formatCountdown(5)).toBe("0:05");
    expect(formatCountdown(-3)).toBe("0:00");
  });

  it("announces only at the one-minute mark and expiry", () => {
    expect(countdownAnnouncement(120)).toBeNull();
    expect(countdownAnnouncement(59)).toBe("One minute left.");
    expect(countdownAnnouncement(0)).toBe("This request has expired.");
  });

  it("computes seconds until a deadline", () => {
    expect(secondsUntil(new Date(10_000), 4_000)).toBe(6);
    expect(secondsUntil(new Date(1_000), 4_000)).toBe(0);
  });
});

describe("stagger", () => {
  it("caps delay after 8 items", () => {
    expect(staggerDelay(0)).toBe(0);
    expect(staggerDelay(7)).toBeCloseTo(0.245);
    expect(staggerDelay(20)).toBe(staggerDelay(7));
  });
});

describe("SuccessCheck", () => {
  it("bursts 8 particles within 24–36 px", () => {
    const v = particleVectors();
    expect(v).toHaveLength(8);
    for (const p of v) {
      const d = Math.hypot(p.x, p.y);
      expect(d).toBeGreaterThanOrEqual(23);
      expect(d).toBeLessThanOrEqual(37);
    }
  });

  it("renders no particles in reduced mode and keeps an accessible label", () => {
    const { container } = render(
      <Reduced>
        <SuccessCheck label="Information shared successfully" />
      </Reduced>,
    );
    expect(screen.getByRole("img", { name: "Information shared successfully" })).toBeInTheDocument();
    expect(container.querySelectorAll(".rounded-full.size-2")).toHaveLength(0);
  });
});

describe("CountUp", () => {
  it("shows the final value immediately in reduced mode", () => {
    render(
      <Reduced>
        <CountUp value={42} />
      </Reduced>,
    );
    expect(screen.getAllByText("42")).toHaveLength(2); // visual + screen-reader copy
  });
});

describe("StatusPill", () => {
  it.each(SESSION_STATUSES)("%s shows its text label, not colour alone", (s) => {
    render(<Reduced><StatusPill status={s} /></Reduced>);
    expect(screen.getByText(SESSION_STATUS_LABELS[s])).toBeInTheDocument();
  });

  it("uses the spec labels for waiting and in-review", () => {
    expect(SESSION_STATUS_LABELS.WAITING).toBe("Waiting");
    expect(SESSION_STATUS_LABELS.IN_REVIEW).toBe("Customer reviewing");
  });
});
