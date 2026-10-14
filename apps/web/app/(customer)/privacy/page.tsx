import type { Metadata } from "next";
import { ScreenHeader } from "@/components/customer/screen-header";

export const metadata: Metadata = { title: "Privacy notice" };

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "What we keep",
    body: [
      "Your profile: name, mobile number, email address, and postal address, if you add them.",
      "A receipt for each request you approve or decline: which business asked, its stated purpose, which details were requested, and which you shared.",
      "Contact details your sign-in provider verified, such as a mobile number confirmed by a one-time code.",
    ],
  },
  {
    title: "Who sees your details",
    body: [
      "Only you can see your profile.",
      "A business receives only the details you approve for one request, and only after you approve it. Declined, expired, or cancelled requests share nothing.",
      "Once you share details, the business keeps them under its own policies. We can't recall details a business has already received.",
    ],
  },
  {
    title: "What we never do",
    body: [
      "We don't put personal details in QR codes, share codes, or links.",
      "We don't sell your details or use them for advertising.",
      "We don't ask for date of birth, government ID numbers, payment details, or medical information.",
    ],
  },
  {
    title: "Verification",
    body: [
      "A verified badge means a contact detail was confirmed, for example by a one-time code. It doesn't verify your identity.",
      "Businesses aren't verified by us yet. Business details are provided by the business itself.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You can change or remove profile details at any time.",
      "You can see every request you approved or declined in your activity.",
    ],
  },
];

/** Plain-language privacy notice. Makes no certification or compliance claims. */
export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-[480px] px-4 pb-12">
      <ScreenHeader title="Privacy notice" subtitle="How DataExchange handles your information." backHref="/home" backLabel="Back" />
      <div className="mt-6 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="text-base font-semibold">{s.title}</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {s.body.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
