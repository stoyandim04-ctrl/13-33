// Two languages, Bulgarian first. The Bulgarian text in the components is the
// key; `tr()` looks it up in src/lib/en.ts when the visitor chose English.
// Structured copy (hero, services, process…) lives twice in src/data/content.ts.
import * as React from "react";

import { EN } from "@/lib/en";

export type Lang = "bg" | "en";
export const LANG_KEY = "1333-lang";

export function translate(lang: Lang, text: string, vars?: Record<string, string | number>): string {
  let out = lang === "en" ? (EN[text] ?? text) : text;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.replace(`{${k}}`, String(v));
  return out;
}

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  tr: (text: string, vars?: Record<string, string | number>) => string;
}

const LangContext = React.createContext<LangState>({ lang: "bg", setLang: () => {}, tr: (t, v) => translate("bg", t, v) });

function initial(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "en" || saved === "bg") return saved;
  } catch {
    /* private mode */
  }
  return "bg";
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>(initial);
  React.useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* private mode */
    }
  }, [lang]);
  const value = React.useMemo<LangState>(
    () => ({ lang, setLang: setLangState, tr: (t, v) => translate(lang, t, v) }),
    [lang],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => React.useContext(LangContext);

/** Picks the language's copy out of a {bg, en} pair. */
export function useCopy<T>(pair: { bg: T; en: T }): T {
  return pair[useLang().lang];
}
