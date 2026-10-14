import { useCallback, useEffect, useRef, useState } from "react";
import { FLAVOURS } from "./data/flavours";
import { Stage } from "./lib/stage";
import { stageRef } from "./lib/stage-ref";
import { StoreProvider, useStore } from "./lib/store";
import { useLenis } from "./lib/scroll";
import { Intro } from "./components/intro";
import { Nav } from "./components/nav";
import { Hero } from "./components/hero";
import { Tour } from "./components/tour";
import { Burst } from "./components/burst";
import { Lineup } from "./components/lineup";
import { Shop } from "./components/shop";
import { Faq } from "./components/faq";
import { Footer } from "./components/footer";
import { Cart } from "./components/cart";

function Site() {
  useLenis();
  const { sel } = useStore();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!canvas.current) return;
    const stage = new Stage(canvas.current);
    let alive = true;
    stage.init().then(() => {
      if (!alive) return;
      stageRef.current = stage;
      stage.start();
      setReady(true);
    });
    return () => {
      alive = false;
      stage.dispose();
      stageRef.current = null;
    };
  }, []);

  // Цветовете на вкуса → CSS и сцената.
  useEffect(() => {
    const f = FLAVOURS[sel];
    const r = document.documentElement.style;
    r.setProperty("--f-bg", f.bg);
    r.setProperty("--f-ink", f.ink);
    r.setProperty("--f-acc", f.accent);
    r.setProperty("--f-hi", f.id === "nula" ? f.accent : f.bg);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", f.bg);
    stageRef.current?.setFlavour(sel);
  }, [sel, ready]);

  // Линията е на кремав фон.
  useEffect(() => {
    let raf = 0;
    let tone = "";
    const tick = () => {
      const H = window.innerHeight;
      const line = document.getElementById("line")?.getBoundingClientRect();
      const shop = document.getElementById("shop")?.getBoundingClientRect();
      const next = line && shop && line.top < H * 0.5 && shop.top > H * 0.5 ? "cream" : "";
      if (next !== tone) {
        tone = next;
        if (tone) document.documentElement.dataset.tone = tone;
        else delete document.documentElement.dataset.tone;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onOpen = useCallback(() => {
    setOpen(true);
    stageRef.current?.drop();
    setTimeout(() => stageRef.current?.kick(0.8), 380);
  }, []);

  return (
    <>
      <Intro ready={ready} onOpen={onOpen} />
      <canvas ref={canvas} className="pointer-events-none fixed inset-0 z-10 h-full w-full" aria-hidden />
      <Nav />
      <main>
        <Hero live={open} />
        <Tour />
        <Burst />
        <Lineup />
        <Shop />
        <Faq />
      </main>
      <Footer />
      <Cart />
      <div className="grain" aria-hidden />
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Site />
    </StoreProvider>
  );
}
