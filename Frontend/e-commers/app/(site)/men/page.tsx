import type { Metadata } from "next";
import { GenderLanding } from "@/components/catalog/GenderLanding";

export const metadata: Metadata = { title: "Men | Satwa" };

export default function MenPage() {
  return <GenderLanding gender="men" />;
}
