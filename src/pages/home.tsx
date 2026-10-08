import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { hero, works } from "@/data/content";
import { projects, STATUS_LABEL } from "@/data/projects";
import { HorizonHero } from "@/components/ui/horizon-hero-section";
import { WorksWheel, type WorksWheelItem } from "@/components/ui/works-wheel";
import { Services } from "@/components/sections/services";
import { Process } from "@/components/sections/process";
import { Why } from "@/components/sections/why";
import { Faq } from "@/components/sections/faq";
import { Contact } from "@/components/sections/contact";

const wheelItems: WorksWheelItem[] = projects.map((p) => ({
  id: p.slug,
  title: p.name,
  image: p.poster,
  video: p.video,
  meta: p.category,
  badge: STATUS_LABEL[p.status],
  href: `/proekti/${p.slug}`,
}));

export default function Home() {
  const navigate = useNavigate();
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
      <HorizonHero id="nachalo" {...hero} scrollHref="#proekti" />
      <WorksWheel
        id="proekti"
        className="scroll-mt-0"
        items={wheelItems}
        label={works.label}
        action={works.action}
        heading={works.heading}
        subheading={works.subheading}
        onOpen={(item) => item.href && navigate(item.href)}
      />
      <Services />
      <Process />
      <Why />
      <Faq />
      <Contact />
    </>
  );
}
