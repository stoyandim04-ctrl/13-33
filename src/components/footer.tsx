import { site } from "../data/content";

export function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="wrap py-20">
        <p className="font-display text-[clamp(4rem,2rem+12vw,13rem)] font-light leading-[0.85] tracking-[-0.02em]">{site.name}</p>
        <div className="mt-14 flex flex-col justify-between gap-6 border-t border-cream/15 pt-8 text-[0.85rem] text-cream/65 md:flex-row">
          <p className="max-w-[36rem]">{site.conceptNote}</p>
          <p>Дизайн и разработка — {site.studio}</p>
        </div>
      </div>
    </footer>
  );
}
