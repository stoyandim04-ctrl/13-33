import { useEffect } from "react";
import { Arrival } from "./components/arrival";
import { Evening } from "./components/evening";
import { Footer } from "./components/footer";
import { Header } from "./components/header";
import { Inquiry } from "./components/inquiry";
import { Materials } from "./components/materials";
import { Residences } from "./components/residences";
import { ScrollTrigger, gsap, prefersReducedMotion, startSmoothScroll } from "./lib/motion";

export default function App() {
  useEffect(() => startSmoothScroll(), []);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          y: 36,
          opacity: 0,
          duration: 1.3,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });
    });
    // fonts and the pinned sections change the page height after first paint
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => ctx.revert();
  }, []);

  return (
    <>
      <a href="#zhilishta" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-paper focus:px-4 focus:py-2">
        Към съдържанието
      </a>
      <Header />
      <main>
        <Arrival />
        <Residences />
        <Evening />
        <Materials />
        <Inquiry />
      </main>
      <Footer />
    </>
  );
}
