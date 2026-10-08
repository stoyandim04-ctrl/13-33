import * as React from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import Home from "@/pages/home";

const ProjectPage = React.lazy(() => import("@/pages/project"));
const NotFound = React.lazy(() => import("@/pages/not-found"));

export default function App() {
  const { pathname } = useLocation();

  // A new page starts at the top (hash links are handled by the home page).
  React.useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <React.Suspense fallback={<div className="h-svh" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/proekti/:slug" element={<ProjectPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </React.Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
