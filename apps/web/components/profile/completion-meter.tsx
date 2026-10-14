import type { ProfileView } from "@dx/shared";
import { ProgressBar } from "@/components/motion/progress-bar";
import { fieldLabel } from "@/lib/fields-ui";

/** "3 of 4 details ready to share" + bar + what's missing. */
export function CompletionMeter({ completeness }: { completeness: ProfileView["completeness"] }) {
  const { done, total, missing } = completeness;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium">
          <span className="tabular">{done}</span> of <span className="tabular">{total}</span> details ready to share
        </p>
      </div>
      <ProgressBar value={total > 0 ? done / total : 0} className="mt-2" />
      {missing.length > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">Missing: {missing.map(fieldLabel).join(", ")}</p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Your profile is complete.</p>
      )}
    </div>
  );
}
