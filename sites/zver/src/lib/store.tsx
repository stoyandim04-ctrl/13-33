import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { FLAVOURS, PACKS } from "../data/flavours";

export type Line = { flavour: string; pack: number; qty: number };

type Store = {
  sel: number;
  setSel: (i: number) => void;
  cart: Line[];
  add: (line: Line) => void;
  remove: (n: number) => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  count: number;
  total: number;
};

const Ctx = createContext<Store | null>(null);
const KEY = "zver-cart";

function read(): Line[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export const priceOf = (pack: number) => PACKS.find((p) => p.size === pack)?.price ?? 0;
export const money = (v: number) => `€${v.toFixed(2)}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [sel, setSelState] = useState(0);
  const [cart, setCart] = useState<Line[]>(read);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(cart));
    } catch {
      /* частен прозорец — количката живее до презареждане */
    }
  }, [cart]);

  const setSel = useCallback((i: number) => setSelState(((i % FLAVOURS.length) + FLAVOURS.length) % FLAVOURS.length), []);
  const add = useCallback((line: Line) => {
    setCart((c) => {
      const n = c.findIndex((l) => l.flavour === line.flavour && l.pack === line.pack);
      if (n < 0) return [...c, line];
      return c.map((l, k) => (k === n ? { ...l, qty: l.qty + line.qty } : l));
    });
  }, []);
  const remove = useCallback((n: number) => setCart((c) => c.filter((_, k) => k !== n)), []);

  const value = useMemo<Store>(
    () => ({
      sel,
      setSel,
      cart,
      add,
      remove,
      cartOpen,
      setCartOpen,
      count: cart.reduce((s, l) => s + l.qty, 0),
      total: cart.reduce((s, l) => s + l.qty * priceOf(l.pack), 0),
    }),
    [sel, setSel, cart, add, remove, cartOpen],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside StoreProvider");
  return v;
}
