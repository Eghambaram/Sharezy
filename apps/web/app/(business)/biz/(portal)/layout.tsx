import type { ReactNode } from "react";
import { requireSession } from "@/lib/auth/server";

/** Business portal screens that need a session. Org scoping is enforced by the API. */
export default async function PortalLayout({ children }: { children: ReactNode }) {
  await requireSession("/biz/login");
  return <div className="min-h-[calc(100dvh-2rem)] bg-surface">{children}</div>;
}
