import * as React from "react";
import { useLocation } from "react-router-dom";

import { useContent } from "@/data/content";
import { projects, STATUS_LABEL } from "@/data/projects";
import { useLang } from "@/lib/i18n";
import { GridHero } from "@/components/ui/grid-hero";
import { WorksWheel, type WorksWheelItem } from "@/components/ui/works-wheel";
import { Manifest } from "@/components/sections/manifest";
import { Services } from "@/components/sections/services";
import { Process } from "@/components/sections/process";
import { Contact } from "@/components/sections/contact";

export default function Home() {
  const { hash, key } = useLocation();
  const { works } = useContent();
  const { lang, tr } = useLang();

  // A project in the wheel links straight to its own site (new tab). Projects
  // without a public address stay in the wheel, without a link.
  const wheelItems = React.useMemo<WorksWheelItem[]>(
    () =>
      projects.map((p) => ({
        id: p.slug,
        title: lang === "en" && p.nameEn ? p.nameEn : p.name,
        image: p.poster,
        video: p.video,
        meta: lang === "en" && p.categoryEn ? p.categoryEn : p.category,
        badge: tr(STATUS_LABEL[p.status]),
        href: p.liveUrl,
      })),
    [lang, tr],
  );

  // Arriving from another page with a hash ("/#proekti"): the browser tried to
  // jump before React rendered, so jump once the page exists.
  React.useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!el) return;
    const id = requestAnimationFrame(() => el.scrollIntoView({ behavior: "auto" }));
    return () => cancelAnimationFrame(id);
  }, [hash, key]);

  React.useEffect(() => {
    document.title = "13:33 — Digital Studio";
  }, []);

  return (
    <>
      <GridHero id="nachalo" />
      <WorksWheel
        id="proekti"
        className="scroll-mt-0"
        items={wheelItems}
        label={works.label}
        action={works.action}
        heading={works.heading}
        subheading={works.subheading}
      />
      <Manifest />
      <Services />
      <Process />
      <Contact />
    </>
  );
}
