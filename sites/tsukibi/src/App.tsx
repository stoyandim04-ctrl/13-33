import { Route, Routes } from "react-router-dom";
import { Header } from "./components/header";
import { PageTransition } from "./components/transition";
import Home from "./pages/home";
import Menu from "./pages/menu";

export default function App() {
  return (
    <div className="grain">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <PageTransition />
    </div>
  );
}
