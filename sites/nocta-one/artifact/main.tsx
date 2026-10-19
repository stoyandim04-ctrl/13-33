import { createRoot } from "react-dom/client";
import "../app/globals.css";
import { Site } from "../components/Site";

createRoot(document.getElementById("root")!).render(<Site />);
