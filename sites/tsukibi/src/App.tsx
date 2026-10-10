import { Route, Routes } from "react-router-dom";
import { CartProvider } from "./lib/cart";
import { Header } from "./components/header";
import { CartDrawer } from "./components/cart-drawer";
import { PageTransition } from "./components/transition";
import Home from "./pages/home";
import Menu from "./pages/menu";

export default function App() {
  return (
    <CartProvider>
      <div className="grain">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="*" element={<Home />} />
        </Routes>
        <CartDrawer />
        <PageTransition />
      </div>
    </CartProvider>
  );
}
