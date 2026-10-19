import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NOCTA One · Silence, Engineered.",
  description:
    "NOCTA One: концептуален продуктов сайт за безжични слушалки. Концептуален проект на 13:33 Digital Studio. Марката и продуктът са измислени.",
};

export const viewport: Viewport = {
  themeColor: "#03060D",
  width: "device-width",
  initialScale: 1,
};

// language is restored before paint so <html lang> is right from the start
const langScript = `try{var l=localStorage.getItem("nocta-lang");if(l==="en"||l==="bg")document.documentElement.lang=l}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: langScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
