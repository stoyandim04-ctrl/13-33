// Turns the single-file Vite build into an Artifact page body:
// the host adds its own doctype/html/head/body, so only title, styles,
// scripts and the root node are kept.
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync(new URL("./dist/index.html", import.meta.url), "utf8");
const head = src.slice(src.indexOf("<head>") + 6, src.indexOf("</head>"));
const body = src.slice(src.indexOf("<body") , src.indexOf("</body>")).replace(/^<body[^>]*>/, "");
const keep = head
  .replace(/<meta charset[^>]*>/i, "")
  .replace(/<meta name="viewport"[^>]*>/i, "");
const title = keep.match(/<title>.*?<\/title>/s)?.[0] ?? "<title>NOCTA One</title>";
const rest = keep.replace(title, "");
writeFileSync(new URL("./dist/nocta-one.html", import.meta.url), `${title}\n${rest}\n${body}\n`);
console.log("ok", (readFileSync(new URL("./dist/nocta-one.html", import.meta.url)).length / 1e6).toFixed(2), "MB");
