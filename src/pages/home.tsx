import * as React from "react";
import { useLocation } from "react-router-dom";

import { works } from "@/data/content";
import { projects, STATUS_LABEL } from "@/data/projects";
import { GridHero } from "@/components/ui/grid-hero";
import { WorksWheel, type WorksWheelItem } from "@/components/ui/works-wheel";
import { Manifest } from "@/components/sections/manifest";
import { Services } from "@/components/sections/services";
import { Process } from "@/components/sections/process";
import { Contact } from "@/components/sections/contact";

// A project in the wheel links straight to its own site (new tab). Projects
// without a public address stay in the wheel, without a link.
const wheelItems: WorksWheelItem[] = projects.map((p) => ({
  id: p.slug,
  title: p.name,
  image: p.poster,
  video: p.video,
  meta: p.category,
  badge: STATUS_LABEL[p.status],
  href: p.liveUrl,
}));

export default function Home() {
  const { hash, key } = useLocation();

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
