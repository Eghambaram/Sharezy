import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextMiddleware } from "next/server";

/**
 * Clerk mode: clerkMiddleware makes `auth()` available to server components.
 * Route protection itself happens in the protected layouts (close to the data,
 * as Clerk recommends), and the API verifies every request regardless.
 * Dev mode: pass-through.
 */
const handler: NextMiddleware =
  process.env.NEXT_PUBLIC_AUTH_MODE === "clerk" ? clerkMiddleware() : () => NextResponse.next();

export default handler;

export const config = {
  matcher: [
    // Skip Next.js internals and static files.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
