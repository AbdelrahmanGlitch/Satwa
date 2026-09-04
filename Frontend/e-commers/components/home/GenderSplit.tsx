import Link from "next/link";
import { ArrowRight } from "lucide-react";

const PANELS = [
  {
    gender: "men",
    label: "For Men",
    tagline: "Oud, leather, and low light",
    image: "/hero/forMen.jpg",
  },
  {
    gender: "women",
    label: "For Women",
    tagline: "Florals with weight",
    image: "/hero/forWomen.jpg",
  },
];

export function GenderSplit() {
  return (
    <section className="grid border-b border-line md:grid-cols-2">
      {PANELS.map((panel) => (
        <Link
          key={panel.gender}
          href={`/${panel.gender}`}
          className="group relative flex h-[70vh] items-end overflow-hidden border-line max-md:border-b md:not-last:border-r"
        >
          <img
            src={panel.image}
            alt={panel.label}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
          <div className="relative z-10 flex w-full items-end justify-between p-10">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-accent">
                {panel.tagline}
              </p>
              <h3 className="mt-3 font-display text-4xl">{panel.label}</h3>
            </div>
            <ArrowRight className="h-6 w-6 shrink-0 text-ivory transition-transform duration-300 group-hover:translate-x-1.5" />
          </div>
        </Link>
      ))}
    </section>
  );
}
