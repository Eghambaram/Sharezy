import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MotionShowcase } from "./showcase";

export const metadata: Metadata = { title: "Motion primitives" };

/** Dev-only catalogue of every motion primitive in normal and reduced modes. */
export default function MotionDevPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <MotionShowcase />;
}
