import { redirect } from "next/navigation";
import { isSignedIn } from "@/lib/auth/server";

/** The PWA opens on the customer experience. Businesses use /biz/login. */
export default async function Root() {
  redirect((await isSignedIn()) ? "/home" : "/welcome");
}
