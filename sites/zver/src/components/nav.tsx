import { useStore } from "../lib/store";
import { scrollToId } from "../lib/scroll";
import { Claw } from "./bits";

const LINKS = [
  ["Flavours", "hero"],
  ["Inside", "tour"],
  ["Lineup", "line"],
  ["Shop", "shop"],
  ["FAQ", "faq"],
] as const;

export function Nav() {
  const { count, setCartOpen } = useStore();
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 px-4 py-3 text-[var(--ink)] sm:px-8 sm:py-5">
      <a
        href="#hero"
        onClick={(e) => {
          e.preventDefault();
          scrollToId("hero");
        }}
        className="flex items-center gap-1.5"
        aria-label="FERAL — home"
      >
        <Claw className="h-7 w-7" />
        <span className="display text-2xl">FERAL</span>
      </a>
      <nav className="label hidden items-center gap-7 md:flex" aria-label="Main menu">
        {LINKS.map(([t, id]) => (
          <a
            key={id}
            href={`#${id}`}
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              scrollToId(id);
            }}
          >
            {t}
          </a>
        ))}
      </nav>
      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="slab label flex items-center gap-2 bg-bone px-3 py-2 text-black"
        aria-label={`Cart, ${count} items`}
      >
        Cart
        <span className="grid h-6 min-w-6 place-items-center bg-black px-1 text-bone tabular-nums">{count}</span>
      </button>
    </header>
  );
}
