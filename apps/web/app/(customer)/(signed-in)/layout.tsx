import type { ReactNode } from "react";
import { requireSession } from "@/lib/auth/server";

/** Customer screens that need a session. The API still authorizes every call. */
export default async function SignedInCustomerLayout({ children }: { children: ReactNode }) {
  await requireSession("/welcome");
  return <div className="mx-auto w-full max-w-[480px] px-4">{children}</div>;
}
