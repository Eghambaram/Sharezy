import type { Metadata } from "next";
import { DashboardView } from "./dashboard-view";

export const metadata: Metadata = { title: "Dashboard" };

/** B03 placeholder — metrics and recent requests arrive in phase 4. */
export default function DashboardPage() {
  return <DashboardView />;
}
