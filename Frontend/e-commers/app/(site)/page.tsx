import { Hero } from "@/components/home/Hero";
import { GenderSplit } from "@/components/home/GenderSplit";
import { BestSellersRail } from "@/components/home/BestSellersRail";
import { CollectionGrid } from "@/components/home/CollectionGrid";
import { OffersSection } from "@/components/home/OffersSection";

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <GenderSplit />
      <BestSellersRail />
      <CollectionGrid />
      <OffersSection />
    </main>
  );
}
