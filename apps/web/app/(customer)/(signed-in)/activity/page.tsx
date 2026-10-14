import type { Metadata } from "next";
import { ActivityView } from "./activity-view";

export const metadata: Metadata = { title: "Your activity" };

/** Activity list (C12 detail, filters and hiding arrive in phase 6). */
export default function ActivityPage() {
  return <ActivityView />;
}
