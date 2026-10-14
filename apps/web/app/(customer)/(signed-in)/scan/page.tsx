import type { Metadata } from "next";
import { QrCode } from "lucide-react";
import { ComingSoon } from "@/components/customer/coming-soon";

export const metadata: Metadata = { title: "Scan QR code" };

/** C06 placeholder — the scanner arrives in phase 5. */
export default function ScanPage() {
  return <ComingSoon title="Scan QR code" icon={QrCode} text="Scanning a business's QR code arrives in the next build phase." />;
}
