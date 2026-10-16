import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { products, type Product, type Size } from "../data/products";

export type Line = { slug: string; size: Size; qty: number };

type Store = {
  lines: Line[];
  count: number;
  total: number;
  add: (slug: string, size: Size) => void;
  setQty: (slug: string, size: Size, qty: number) => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  /** Индексът на отворената дреха във визьора (null = затворен). */
  viewing: number | null;
  view: (i: number | null) => void;
};

const Ctx = createContext<Store | null>(null);
const KEY = "vaelo-cart";

function load(): Line[] {
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? (JSON.parse(raw) as Line[]) : [];
    return Array.isArray(v) ? v.filter((l) => products.some((p) => p.slug === l.slug)) : [];
  } catch {
    return [];
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<Line[]>(load);
  const [cartOpen, setCartOpen] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* частен режим — количката живее само в паметта */
    }
  }, [lines]);

  const add = useCallback((slug: string, size: Size) => {
    setLines((ls) => {
      const i = ls.findIndex((l) => l.slug === slug && l.size === size);
      if (i === -1) return [...ls, { slug, size, qty: 1 }];
      return ls.map((l, k) => (k === i ? { ...l, qty: l.qty + 1 } : l));
    });
  }, []);

  const setQty = useCallback((slug: string, size: Size, qty: number) => {
    setLines((ls) =>
      qty <= 0 ? ls.filter((l) => !(l.slug === slug && l.size === size)) : ls.map((l) => (l.slug === slug && l.size === size ? { ...l, qty } : l)),
    );
  }, []);

  const value = useMemo<Store>(() => {
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const total = lines.reduce((s, l) => s + l.qty * (bySlug(l.slug)?.price ?? 0), 0);
    return { lines, count, total, add, setQty, cartOpen, setCartOpen, viewing, view: setViewing };
  }, [lines, add, setQty, cartOpen, viewing]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside StoreProvider");
  return v;
}

export const bySlug = (slug: string): Product | undefined => products.find((p) => p.slug === slug);
