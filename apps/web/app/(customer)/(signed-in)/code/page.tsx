import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { ComingSoon } from "@/components/customer/coming-soon";

export const metadata: Metadata = { title: "Enter share code" };

/** C07 placeholder — share-code entry arrives in phase 5. */
export default function CodePage() {
  return <ComingSoon title="Enter share code" icon={KeyRound} text="Entering a 6-digit share code arrives in the next build phase." />;
}
