import type { Metadata } from "next";
import { GenderLanding } from "@/components/catalog/GenderLanding";

export const metadata: Metadata = { title: "Women | Satwa" };

export default function WomenPage() {
  return <GenderLanding gender="women" />;
}
