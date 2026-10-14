import type { Metadata } from "next";
import { ProfileSetupView } from "./setup-view";

export const metadata: Metadata = { title: "Set up your profile" };

/** C04 — profile setup for new customers. */
export default function ProfileSetupPage() {
  return <ProfileSetupView />;
}
