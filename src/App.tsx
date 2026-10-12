import * as React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import Home from "@/pages/home";

const NotFound = React.lazy(() => import("@/pages/not-found"));
const StartPage = React.lazy(() => import("@/pages/start"));
const RoomPage = React.lazy(() => import("@/pages/room"));
const StudioPage = React.lazy(() => import("@/pages/studio"));

export default function App() {
  const { pathname } = useLocation();

  // A new page starts at the top (hash links are handled by the home page).
  React.useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [pathname]);

  // Anything marked data-reveal fades up once it enters the screen.
  React.useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"));
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  const chrome = !(pathname.startsWith("/studio") || pathname.startsWith("/zapitvane/") || pathname === "/zapochni");

  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} key={pathname} className="page-in outline-none">
        <React.Suspense fallback={<div className="h-svh" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Old project pages: the wheel now opens the project's own site. */}
            <Route path="/proekti/*" element={<Navigate to="/#proekti" replace />} />
            <Route path="/zapochni" element={<StartPage />} />
            <Route path="/zapitvane/:token" element={<RoomPage />} />
            <Route path="/studio" element={<StudioPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </React.Suspense>
      </main>
      {chrome ? <SiteFooter /> : null}
    </>
  );
}
