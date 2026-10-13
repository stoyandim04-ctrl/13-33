import { Atelier } from "./components/atelier";
import { Cart, Footer, Header, Marquee } from "./components/chrome";
import { Collection } from "./components/collection";
import { Orbit } from "./components/orbit";
import { Rail } from "./components/rail";
import { Turn } from "./components/turn";
import { Viewer } from "./components/viewer";
import { useLenis } from "./hooks/use-lenis";
import { StoreProvider } from "./lib/store";

export default function App() {
  useLenis();
  return (
    <StoreProvider>
      <Header />
      <main id="top" className="grain relative">
        <Orbit />
        <Marquee />
        <Rail />
        <Turn />
        <Collection />
        <Atelier />
      </main>
      <Footer />
      <Viewer />
      <Cart />
    </StoreProvider>
  );
}
