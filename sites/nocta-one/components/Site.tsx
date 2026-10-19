"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { setUI, type Lang } from "@/lib/store";
import { ScrollController } from "./ScrollController";
import { Cursor } from "./ui/Cursor";
import { Hud } from "./ui/Hud";
import { Preloader } from "./ui/Preloader";
import { SceneCopy } from "./ui/SceneCopy";

const Experience = dynamic(() => import("./Experience"), { ssr: false });

export function Site() {
  useEffect(() => {
    const l = document.documentElement.lang as Lang;
    if (l === "en" || l === "bg") setUI({ lang: l });
    if (process.env.NODE_ENV !== "production") {
      import("@/lib/timeline").then(({ assertLoop }) => {
        const bad = assertLoop();
        if (bad.length) console.warn("[timeline] loop broken:\n" + bad.join("\n"));
      });
    }
  }, []);

  return (
    <>
      <Experience />
      <SceneCopy />
      <Hud />
      <Cursor />
      <Preloader />
      <ScrollController />
    </>
  );
}
