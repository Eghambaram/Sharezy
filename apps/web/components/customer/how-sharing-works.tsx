import { CircleCheck, ListChecks, QrCode } from "lucide-react";

const STEPS = [
  { icon: QrCode, title: "Start a request", text: "Scan a business's QR code, or enter the 6-digit code they read to you." },
  { icon: ListChecks, title: "Review and choose", text: "See who is asking and why. Turn on only the details you want to share." },
  { icon: CircleCheck, title: "Approve or decline", text: "Nothing is sent until you approve. You get a receipt either way." },
];

/** The three-step explainer used on the empty home screen and the profile page. */
export function HowSharingWorks() {
  return (
    <ol className="space-y-4">
      {STEPS.map(({ icon: Icon, title, text }, i) => (
        <li key={title} className="flex gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft">
            <Icon className="size-4 text-accent-strong" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium">
              <span className="sr-only">Step {i + 1}: </span>
              {title}
            </p>
            <p className="text-sm text-muted-foreground">{text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
