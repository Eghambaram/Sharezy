import type { Metadata } from "next";
import { HomeView } from "./home-view";

export const metadata: Metadata = { title: "Home" };

/** C05 placeholder — full home (scan / enter code / activity) arrives in phase 3. */
export default function HomePage() {
  return <HomeView />;
}
