import type { Metadata } from "next";
import { ProfileView } from "./profile-view";

export const metadata: Metadata = { title: "Profile and privacy" };

/** C13 — profile and privacy (account deletion arrives in phase 7). */
export default function ProfilePage() {
  return <ProfileView />;
}
