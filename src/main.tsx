import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/react";

import "@/index.css";
import App from "@/App";
import { LangProvider } from "@/lib/i18n";
import { captureSource } from "@/lib/source";
import { setupDisplayFont } from "@/lib/display-font";

captureSource();
void setupDisplayFont();

/**
 * Vercel Web Analytics: cookieless page views, no consent banner needed.
 * The studio panel is never counted, and a client's private link
 * (/zapitvane/<token>) is reported without its token.
 */
function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  const url = new URL(event.url);
  if (url.pathname.startsWith("/studio")) return null;
  if (url.pathname.startsWith("/zapitvane/")) url.pathname = "/zapitvane/[token]";
  return { ...event, url: url.toString() };
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <LangProvider>
        <App />
      </LangProvider>
    </BrowserRouter>
    <Analytics beforeSend={beforeSend} />
  </StrictMode>,
);
