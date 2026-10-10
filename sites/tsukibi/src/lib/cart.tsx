import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dishes, type Dish } from "../data/menu";

interface CartLine {
  dish: Dish;
  qty: number;
}

interface CartValue {
  lines: CartLine[];
  count: number;
  total: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (slug: string) => void;
  change: (slug: string, delta: number) => void;
  clear: () => void;
  /** Последно добавено — за кратката анимация в бутона. */
  pulse: number;
}

const CartContext = createContext<CartValue | null>(null);
const KEY = "tsukibi-cart";

function load(): Record<string, number> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [qty, setQty] = useState<Record<string, number>>(load);
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(qty));
    } catch {
      /* частен прозорец — количката живее само в паметта */
    }
  }, [qty]);

  const add = useCallback((slug: string) => {
    setQty((q) => ({ ...q, [slug]: (q[slug] ?? 0) + 1 }));
    setPulse((p) => p + 1);
  }, []);

  const change = useCallback((slug: string, delta: number) => {
    setQty((q) => {
      const next = { ...q, [slug]: Math.max(0, (q[slug] ?? 0) + delta) };
      if (next[slug] === 0) delete next[slug];
      return next;
    });
  }, []);

  const clear = useCallback(() => setQty({}), []);

  const value = useMemo<CartValue>(() => {
    const lines = dishes.filter((d) => qty[d.slug]).map((dish) => ({ dish, qty: qty[dish.slug] }));
    return {
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      total: lines.reduce((s, l) => s + l.qty * l.dish.price, 0),
      open,
      setOpen,
      add,
      change,
      clear,
      pulse,
    };
  }, [qty, open, add, change, clear, pulse]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart outside CartProvider");
  return ctx;
}
