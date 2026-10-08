// Six concept mock-ups for the 13:33 portfolio. Each is a self-contained page
// designed for this purpose - no third-party sites, no stock imagery (all
// "photography" is drawn with CSS/SVG). build-concept-media.mjs renders a poster
// and a short scroll recording from each.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const font = (p) => pathToFileURL(path.join(root, "node_modules", p)).href;

const LATIN = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215";
const CYR = "U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116";

const face = (family, weight, latin, cyr) => `
@font-face{font-family:'${family}';font-weight:${weight};src:url('${font(latin)}') format('woff2');unicode-range:${LATIN}}
@font-face{font-family:'${family}';font-weight:${weight};src:url('${font(cyr)}') format('woff2');unicode-range:${CYR}}`;

const FONTS =
  face("Sofia", "100 900", "@fontsource-variable/sofia-sans/files/sofia-sans-latin-wght-normal.woff2", "@fontsource-variable/sofia-sans/files/sofia-sans-cyrillic-wght-normal.woff2") +
  face("SofiaC", "100 900", "@fontsource-variable/sofia-sans-condensed/files/sofia-sans-condensed-latin-wght-normal.woff2", "@fontsource-variable/sofia-sans-condensed/files/sofia-sans-condensed-cyrillic-wght-normal.woff2") +
  [400, 500, 600].map((w) => face("Corm", w, `@fontsource/cormorant-garamond/files/cormorant-garamond-latin-${w}-normal.woff2`, `@fontsource/cormorant-garamond/files/cormorant-garamond-cyrillic-${w}-normal.woff2`)).join("") +
  [300, 400, 600].map((w) => face("Unb", w, `@fontsource/unbounded/files/unbounded-latin-${w}-normal.woff2`, `@fontsource/unbounded/files/unbounded-cyrillic-${w}-normal.woff2`)).join("");

const page = (css, body) => `<!doctype html><html lang="bg"><head><meta charset="utf-8">
<style>${FONTS}
*{box-sizing:border-box;margin:0;padding:0}
html,body{-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
::-webkit-scrollbar{display:none}
@keyframes up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes fade{from{opacity:0}to{opacity:1}}
.up{animation:up 1.1s cubic-bezier(.16,1,.3,1) both}
.d1{animation-delay:.15s}.d2{animation-delay:.3s}.d3{animation-delay:.45s}
${css}</style></head><body>${body}</body></html>`;

// ---------------------------------------------------------------------------
// 1. Линия Архитекти - architecture studio, light, serif.
const liniya = page(
  `body{background:#ECEAE5;color:#141414;font-family:Sofia,sans-serif}
  nav{display:flex;justify-content:space-between;align-items:center;padding:34px 56px;font-size:15px;letter-spacing:.02em}
  nav b{font-family:Corm;font-weight:600;font-size:26px;letter-spacing:.01em}
  nav span{margin-left:34px;color:#555}
  .hero{display:grid;grid-template-columns:5fr 7fr;gap:48px;padding:40px 56px 0;align-items:end}
  h1{font-family:Corm;font-weight:500;font-size:96px;line-height:.92;letter-spacing:-.02em}
  .lead{margin-top:28px;font-size:18px;line-height:1.6;color:#4a4a4a;max-width:34ch}
  .btn{display:inline-block;margin-top:34px;border-bottom:1px solid #141414;padding-bottom:4px;font-size:15px}
  .photo{position:relative;height:620px;overflow:hidden;background:linear-gradient(180deg,#c9d3d9 0%,#e9e2d6 70%,#d9cfbf 100%)}
  .sun{position:absolute;right:16%;top:12%;width:120px;height:120px;border-radius:50%;background:radial-gradient(#fff6e0,rgba(255,240,210,0))}
  .m1{position:absolute;left:8%;bottom:0;width:58%;height:58%;background:linear-gradient(90deg,#bdb6aa,#a39c90)}
  .m2{position:absolute;left:30%;bottom:34%;width:62%;height:24%;background:linear-gradient(90deg,#d8d2c6,#c4bdb1);box-shadow:0 30px 40px -20px rgba(0,0,0,.25)}
  .glass{position:absolute;left:14%;bottom:8%;width:40%;height:36%;background:linear-gradient(120deg,#2f3a40,#59666c 60%,#3a454b);opacity:.9}
  .line{position:absolute;left:14%;bottom:8%;width:40%;height:36%;background:repeating-linear-gradient(90deg,transparent 0 58px,#cfc8bb 58px 61px)}
  .ground{position:absolute;left:0;right:0;bottom:0;height:8%;background:#8f8a7e}
  .tree{position:absolute;bottom:8%;width:70px;height:140px;border-radius:50% 50% 45% 45%;background:radial-gradient(circle at 40% 35%,#6f7a5c,#3f4834)}
  .meta{display:flex;justify-content:space-between;padding:18px 56px 0;font-size:13px;color:#666;letter-spacing:.08em;text-transform:uppercase}
  section{padding:110px 56px}
  h2{font-family:Corm;font-weight:500;font-size:58px;letter-spacing:-.01em}
  .grid{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:28px;margin-top:48px}
  .card .img{height:380px;position:relative;overflow:hidden}
  .card p{margin-top:16px;font-size:15px}.card small{display:block;color:#777;margin-top:4px;font-size:13px}
  .a{background:linear-gradient(180deg,#d6dde0,#efe7da)}.a:after{content:"";position:absolute;left:12%;right:12%;bottom:0;height:55%;background:linear-gradient(90deg,#5d5850,#7a746a);clip-path:polygon(0 30%,55% 0,100% 30%,100% 100%,0 100%)}
  .b{background:linear-gradient(180deg,#e7e1d6,#cfc6b6)}.b:after{content:"";position:absolute;left:20%;right:20%;top:18%;bottom:0;background:repeating-linear-gradient(0deg,#f4f0e8 0 34px,#bfb6a6 34px 36px)}
  .c{background:linear-gradient(180deg,#22292d,#3c464b)}.c:after{content:"";position:absolute;left:0;right:0;bottom:0;height:40%;background:linear-gradient(90deg,#d9b98a,#a8875d);opacity:.85}
  .quote{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
  .quote p{font-family:Corm;font-size:40px;line-height:1.15}
  .stats{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #c9c4ba}
  .stats div{padding:28px 0;font-size:14px;color:#555}.stats b{display:block;font-family:Corm;font-weight:500;font-size:42px;color:#141414}`,
  `<nav><b>Линия</b><div><span>Обекти</span><span>Студио</span><span>Процес</span><span>Контакт</span></div></nav>
  <div class="hero"><div><h1 class="up">Пространства,<br>които<br>остават.</h1><p class="lead up d1">Архитектура и интериор за домове и работни пространства — от първата скица до ключа.</p><span class="btn up d2">Разгледай обектите →</span></div>
  <div class="photo up d1"><div class="sun"></div><div class="m1"></div><div class="glass"></div><div class="line"></div><div class="m2"></div><div class="tree" style="left:62%"></div><div class="tree" style="left:72%;height:110px;width:56px"></div><div class="ground"></div></div></div>
  <div class="meta"><span>Обект 07 — Къща край гората</span><span>240 м² · Жилищна</span></div>
  <section><h2>Избрани обекти</h2><div class="grid">
  <div class="card"><div class="img a"></div><p>Планинска къща</p><small>Жилищна · 180 м²</small></div>
  <div class="card"><div class="img b"></div><p>Офис в стара сграда</p><small>Интериор · 420 м²</small></div>
  <div class="card"><div class="img c"></div><p>Ателие с градина</p><small>Смесена · 95 м²</small></div></div></section>
  <section class="quote"><p>Всеки обект започва с въпроса как ще се живее в него.</p><div class="stats"><div><b>01</b>Разговор и оглед</div><div><b>02</b>Концепция</div><div><b>03</b>Проект и надзор</div></div></section>
  <section style="padding-top:0"><h2>Да поговорим за мястото ти.</h2><span class="btn">Изпрати запитване →</span></section>`,
);

// ---------------------------------------------------------------------------
// 2. Глина & Огън - ceramics shop, warm.
const vase = (w, h, c1, c2, r = "45% 45% 40% 40% / 60% 60% 40% 40%") =>
  `<div style="width:${w}px;height:${h}px;border-radius:${r};background:radial-gradient(circle at 35% 30%,${c1},${c2} 70%);box-shadow:inset -18px -10px 30px rgba(0,0,0,.18),0 30px 30px -24px rgba(60,30,10,.45)"></div>`;
const glina = page(
  `body{background:#F2ECE3;color:#2B1D16;font-family:Sofia,sans-serif}
  nav{display:flex;justify-content:space-between;align-items:center;padding:26px 52px;font-size:15px;border-bottom:1px solid #e0d6c8}
  nav b{font-family:Corm;font-size:28px;font-weight:600}nav span{margin-left:30px}
  .bag{background:#2B1D16;color:#F2ECE3;border-radius:99px;padding:8px 16px;margin-left:30px}
  .hero{display:grid;grid-template-columns:1fr 1fr;min-height:640px}
  .hero .t{padding:90px 52px}
  h1{font-family:Corm;font-weight:500;font-size:84px;line-height:.95}
  .t p{margin-top:24px;font-size:18px;line-height:1.6;color:#6b5547;max-width:32ch}
  .cta{display:inline-block;margin-top:34px;background:#B5654A;color:#fff;padding:16px 28px;border-radius:99px;font-weight:600}
  .stage{background:radial-gradient(circle at 50% 60%,#e7c9ad,#c98f6b 75%);display:flex;align-items:flex-end;justify-content:center;gap:26px;padding-bottom:110px;position:relative}
  .stage:after{content:"";position:absolute;left:0;right:0;bottom:0;height:110px;background:#b77856}
  .stage>div{position:relative;z-index:1}
  .row{display:flex;justify-content:space-between;align-items:baseline;padding:80px 52px 30px}
  h2{font-family:Corm;font-weight:500;font-size:52px}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;padding:0 52px}
  .p .img{height:300px;background:#E8DED1;display:flex;align-items:center;justify-content:center;border-radius:4px}
  .p p{margin-top:14px;display:flex;justify-content:space-between;font-size:15px}.p small{color:#8a7465}
  .band{margin:90px 52px;display:grid;grid-template-columns:1fr 1fr;gap:40px;background:#2B1D16;color:#F2ECE3;padding:60px;border-radius:6px}
  .band h3{font-family:Corm;font-weight:500;font-size:44px;line-height:1}.band p{color:#cdbbaa;line-height:1.6}`,
  `<nav><b>Глина &amp; Огън</b><div><span>Колекции</span><span>Работилница</span><span>Подаръци</span><span class="bag">Количка · 2</span></div></nav>
  <div class="hero"><div class="t"><h1 class="up">Ръчно.<br>Бавно.<br>За всеки ден.</h1><p class="up d1">Керамика от малка работилница — всяко изделие е изпечено два пъти и е единствено по рода си.</p><span class="cta up d2">Разгледай колекцията</span></div>
  <div class="stage">${vase(150, 250, "#efe3d3", "#b9a58f")}${vase(190, 190, "#4b5a55", "#25302d", "50%/55% 55% 45% 45%")}${vase(120, 170, "#d98e6c", "#8e4128")}</div></div>
  <div class="row"><h2>Нова колекция „Пепел“</h2><span>Виж всички →</span></div>
  <div class="grid">
  <div class="p"><div class="img">${vase(110, 170, "#ece2d5", "#a9957f")}</div><p>Ваза „Пепел“<small>64 €</small></p></div>
  <div class="p"><div class="img">${vase(170, 90, "#5b6964", "#2c3734", "20% 20% 50% 50% / 20% 20% 80% 80%")}</div><p>Купа за маса<small>48 €</small></p></div>
  <div class="p"><div class="img">${vase(90, 110, "#dc9877", "#8c4229", "18% 18% 30% 30%")}</div><p>Чаша, 2 бр.<small>36 €</small></p></div>
  <div class="p"><div class="img">${vase(150, 150, "#f2ebe1", "#c2ad95", "50%")}</div><p>Ваза „Луна“<small>72 €</small></p></div></div>
  <div class="band"><h3>Изработва се за 7–10 дни.</h3><p>Всяко изделие се прави по поръчка. Получаваш снимка преди изпращане и грижа за опаковането.</p></div>`,
);

// ---------------------------------------------------------------------------
// 3. Ритъм - coaching funnel.
const ritam = page(
  `body{background:#0F2A24;color:#EFE8D8;font-family:Sofia,sans-serif}
  nav{display:flex;justify-content:space-between;align-items:center;padding:28px 56px}
  nav b{font-family:Unb;font-weight:600;font-size:22px;letter-spacing:.02em}
  .pill{border:1px solid rgba(239,232,216,.3);border-radius:99px;padding:10px 18px;font-size:14px}
  .hero{padding:70px 56px 90px;display:grid;grid-template-columns:7fr 5fr;gap:48px;align-items:center}
  h1{font-family:Unb;font-weight:400;font-size:64px;line-height:1.02;letter-spacing:-.02em}
  h1 em{font-style:normal;color:#E8743B}
  .hero p{margin-top:26px;font-size:19px;line-height:1.55;color:#c7c0ae;max-width:36ch}
  .cta{display:inline-flex;gap:10px;margin-top:34px;background:#E8743B;color:#0F2A24;padding:18px 30px;border-radius:99px;font-weight:700}
  .portrait{height:520px;border-radius:260px 260px 12px 12px;background:radial-gradient(circle at 50% 30%,#E9D8BC 0 16%,transparent 17%),radial-gradient(ellipse at 50% 85%,#c9a882 0 38%,transparent 39%),linear-gradient(180deg,#245247,#163c34);position:relative;overflow:hidden}
  .band{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid rgba(239,232,216,.15);border-bottom:1px solid rgba(239,232,216,.15)}
  .band div{padding:34px 56px;font-size:15px;color:#c7c0ae}.band b{display:block;font-family:Unb;font-weight:400;font-size:30px;color:#EFE8D8;margin-bottom:6px}
  section{padding:100px 56px;display:grid;grid-template-columns:1fr 1fr;gap:60px}
  h2{font-family:Unb;font-weight:400;font-size:42px;line-height:1.08}
  .quiz{background:#EFE8D8;color:#0F2A24;border-radius:14px;padding:36px}
  .quiz small{letter-spacing:.14em;font-size:12px;color:#5e6b63}
  .quiz h3{font-family:Unb;font-weight:400;font-size:24px;margin:12px 0 22px}
  .opt{border:1.5px solid #cfc6b1;border-radius:10px;padding:16px 18px;margin-top:10px;font-size:16px;display:flex;justify-content:space-between}
  .opt.on{border-color:#E8743B;background:#f7e2d4}
  .bar{height:4px;background:#d9d0bb;border-radius:4px;margin-top:22px}.bar i{display:block;height:4px;width:40%;background:#E8743B;border-radius:4px}
  .slots{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:22px}
  .slots span{border:1px solid rgba(239,232,216,.25);border-radius:8px;padding:14px;text-align:center;font-size:15px}
  .slots .on{background:#E8743B;color:#0F2A24;border-color:#E8743B;font-weight:700}`,
  `<nav><b>РИТЪМ</b><span class="pill">Запиши разговор</span></nav>
  <div class="hero"><div><h1 class="up">12 седмици до форма, която <em>се задържа</em>.</h1><p class="up d1">Онлайн програма с тренировки, хранене и седмична обратна връзка — изградена около графика ти.</p><span class="cta up d2">Започни с 3 въпроса →</span></div><div class="portrait up d1"></div></div>
  <div class="band"><div><b>3 тренировки</b>седмично, у дома или в зала</div><div><b>1 разговор</b>всяка седмица за напредъка</div><div><b>0 диети</b>с изключване на храни</div></div>
  <section><div><h2>Първо да разберем целта ти.</h2><p style="margin-top:20px;color:#c7c0ae;line-height:1.6;max-width:34ch">Кратък въпросник подготвя първия разговор, така че той да е за теб, а не за формалности.</p></div>
  <div class="quiz"><small>ВЪПРОС 2 ОТ 5</small><h3>Каква е основната ти цел?</h3><div class="opt">Да отслабна<span>○</span></div><div class="opt on">Повече сила и енергия<span>●</span></div><div class="opt">Да се върна след пауза<span>○</span></div><div class="bar"><i></i></div></div></section>
  <section style="padding-top:0"><div><h2>Избери час за разговор.</h2></div><div><div class="slots"><span>Пон 10:00</span><span>Пон 14:30</span><span class="on">Вт 18:00</span><span>Ср 09:30</span><span>Чет 12:00</span><span>Чет 17:00</span><span>Пет 11:00</span><span>Пет 16:30</span></div></div></section>`,
);

// ---------------------------------------------------------------------------
// 4. Сфера - client portal.
const sfera = page(
  `body{background:#F4F5F7;color:#14182B;font-family:Sofia,sans-serif;display:grid;grid-template-columns:250px 1fr;min-height:2000px}
  aside{background:#14182B;color:#C9CCE0;padding:30px 22px;position:sticky;top:0;height:100vh}
  aside b{font-family:SofiaC;font-weight:600;font-size:26px;color:#fff;letter-spacing:.04em}
  aside ul{list-style:none;margin-top:40px}aside li{padding:12px 14px;border-radius:8px;font-size:15px;margin-bottom:4px}
  aside li.on{background:#2A3152;color:#fff}
  main{padding:34px 44px}
  .top{display:flex;justify-content:space-between;align-items:center}
  h1{font-family:SofiaC;font-weight:500;font-size:40px;letter-spacing:-.01em}
  .av{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#7b8cff,#3d4bb3)}
  .grid{display:grid;grid-template-columns:2fr 1fr;gap:22px;margin-top:30px}
  .card{background:#fff;border-radius:12px;padding:26px;box-shadow:0 1px 0 #e3e5ea}
  .card h2{font-size:14px;letter-spacing:.12em;text-transform:uppercase;color:#7A7F95;font-weight:600}
  .stage{display:flex;gap:8px;margin-top:22px}.stage div{flex:1;height:8px;border-radius:6px;background:#E3E6F0}.stage .d{background:#4B5FE0}.stage .c{background:linear-gradient(90deg,#4B5FE0 55%,#E3E6F0 55%)}
  .big{font-family:SofiaC;font-size:30px;font-weight:500;margin-top:22px}
  .row{display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid #EEF0F4;font-size:15px}
  .row small{color:#7A7F95}
  .tag{font-size:12px;padding:4px 10px;border-radius:99px;background:#E8ECFF;color:#3644B5;font-weight:600}
  .msg{display:flex;gap:12px;margin-top:16px}.msg i{flex:none;width:34px;height:34px;border-radius:50%;background:#d9dcef}
  .msg p{background:#F4F5F7;border-radius:10px;padding:12px 14px;font-size:14px;line-height:1.5}`,
  `<aside><b>СФЕРА</b><ul><li class="on">Табло</li><li>Проекти</li><li>Документи</li><li>Съобщения</li><li>Фактури</li><li>Настройки</li></ul></aside>
  <main><div class="top"><h1 class="up">Добре дошла, Мария</h1><div class="av"></div></div>
  <div class="grid"><div class="card up d1"><h2>Текущ проект</h2><div class="big">Стратегия за разрастване 2027</div><div class="stage"><div class="d"></div><div class="d"></div><div class="c"></div><div></div><div></div></div>
  <div class="row" style="margin-top:18px"><span>Етап 3 от 5 — Анализ на пазара</span><small>отговорник: Иван П.</small></div><div class="row"><span>Следваща стъпка: преглед на чернова</span><span class="tag">до 14 ноем.</span></div></div>
  <div class="card up d2"><h2>Съобщения</h2><div class="msg"><i></i><p>Качих първата версия на анализа. Ще я обсъдим в четвъртък.</p></div><div class="msg"><i style="background:#c7d0ff"></i><p>Благодаря! Добавих коментари по раздел 2.</p></div></div></div>
  <div class="grid"><div class="card"><h2>Документи</h2>
  <div class="row"><span>Анализ на пазара — v1.pdf</span><small>вчера</small></div><div class="row"><span>Договор и обхват.pdf</span><small>12 окт.</small></div><div class="row"><span>Въпросник — отговори.docx</span><small>3 окт.</small></div><div class="row"><span>Протокол от среща 02.pdf</span><small>28 сеп.</small></div></div>
  <div class="card"><h2>Предстои</h2><div class="row"><span>Среща за преглед</span><small>чет 10:00</small></div><div class="row"><span>Финална презентация</span><small>2 дек.</small></div></div></div>
  <div class="grid"><div class="card"><h2>Всички проекти</h2><div class="row"><span>Одит на процесите</span><span class="tag" style="background:#E6F6EE;color:#1E7A4C">Приключен</span></div><div class="row"><span>Стратегия за разрастване 2027</span><span class="tag">В процес</span></div></div><div class="card"><h2>Фактури</h2><div class="row"><span>№ 0042</span><small>платена</small></div><div class="row"><span>№ 0047</span><small>предстои</small></div></div></div></main>`,
);

// ---------------------------------------------------------------------------
// 5. Обсидиан - single-product page.
const obsidian = page(
  `body{background:#0A0A0B;color:#ECE9E2;font-family:Sofia,sans-serif}
  nav{display:flex;justify-content:space-between;padding:30px 56px;font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:#9a968e}
  nav b{color:#ECE9E2}
  .hero{position:relative;height:760px;overflow:hidden}
  h1{position:absolute;left:0;right:0;top:40px;text-align:center;font-family:SofiaC;font-weight:200;font-size:190px;letter-spacing:.06em;color:#1d1c1b}
  .lamp{position:absolute;left:50%;top:150px;transform:translateX(-50%);width:420px;height:560px}
  .arm{position:absolute;left:200px;top:120px;width:10px;height:380px;background:linear-gradient(90deg,#2a2a2a,#4a4a48,#1a1a1a);border-radius:4px}
  .shade{position:absolute;left:95px;top:60px;width:230px;height:110px;border-radius:120px 120px 10px 10px;background:linear-gradient(160deg,#3a3936,#121212 70%)}
  .glow{position:absolute;left:30px;top:160px;width:360px;height:380px;background:radial-gradient(ellipse at 50% 0%,rgba(255,214,150,.55),rgba(255,180,90,.08) 55%,transparent 70%);clip-path:polygon(32% 0,68% 0,100% 100%,0 100%);animation:fade 2s both}
  .base{position:absolute;left:120px;top:495px;width:180px;height:26px;border-radius:50%;background:radial-gradient(ellipse at 50% 30%,#4b4a47,#121212)}
  .floor{position:absolute;left:0;right:0;bottom:0;height:160px;background:radial-gradient(ellipse at 50% 0%,rgba(255,200,120,.18),transparent 60%)}
  .buy{position:absolute;left:56px;right:56px;bottom:40px;display:flex;justify-content:space-between;align-items:end}
  .buy p{font-size:20px;max-width:30ch;line-height:1.5;color:#b7b2a8}
  .btn{background:#ECE9E2;color:#0A0A0B;padding:18px 30px;border-radius:99px;font-weight:600;letter-spacing:.02em}
  section{padding:120px 56px;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
  h2{font-family:SofiaC;font-weight:300;font-size:64px;line-height:1}
  .det{height:420px;border-radius:4px;background:radial-gradient(circle at 30% 30%,#55524c,#151514 60%);position:relative;overflow:hidden}
  .det:after{content:"";position:absolute;inset:30% -10% -10% 30%;background:repeating-linear-gradient(115deg,rgba(255,255,255,.05) 0 2px,transparent 2px 9px)}
  .spec{border-top:1px solid #2a2a2a}.spec div{display:flex;justify-content:space-between;padding:20px 0;border-bottom:1px solid #2a2a2a;font-size:16px}.spec span{color:#8f8b83}`,
  `<nav><b>Обсидиан</b><span>Дизайн</span><span>Материали</span><span>Поръчка</span></nav>
  <div class="hero"><h1>ОБСИДИАН</h1><div class="lamp"><div class="glow"></div><div class="arm"></div><div class="shade"></div><div class="base"></div></div><div class="floor"></div>
  <div class="buy"><p class="up">Настолна лампа от лят алуминий и вулканично стъкло. Топла светлина, която пада точно където трябва.</p><span class="btn up d1">Поръчай — 290 €</span></div></div>
  <section><div class="det"></div><div><h2>Материалът<br>е формата.</h2><p style="margin-top:24px;color:#9a968e;line-height:1.7;max-width:36ch">Корпусът е отлят от едно парче и ръчно шлифован. Всяка лампа има собствена текстура.</p></div></section>
  <section style="padding-top:0"><div><h2>Детайли</h2></div><div class="spec"><div>Височина<span>46 см</span></div><div>Светлина<span>2700 K, димируема</span></div><div>Материал<span>алуминий, стъкло</span></div><div>Доставка<span>2–4 работни дни</span></div></div></section>`,
);

// ---------------------------------------------------------------------------
// 6. Поток - service requests + automation.
const ticket = (t, s, who, c = "#5B7CFA") =>
  `<div class="tk"><div class="tl"><i style="background:${c}"></i>${s}</div><p>${t}</p><small>${who}</small></div>`;
const potok = page(
  `body{background:#0E1218;color:#E7EAF0;font-family:Sofia,sans-serif}
  nav{display:flex;justify-content:space-between;align-items:center;padding:20px 36px;border-bottom:1px solid #1f2632}
  nav b{font-family:SofiaC;font-weight:600;font-size:24px;letter-spacing:.06em}
  .new{background:#3DDC97;color:#0E1218;padding:10px 18px;border-radius:8px;font-weight:700;font-size:14px}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:28px 36px}
  .kpi{background:#151B24;border:1px solid #1f2632;border-radius:10px;padding:20px}
  .kpi small{color:#8792a5;font-size:13px}.kpi b{display:block;font-family:SofiaC;font-weight:500;font-size:40px;margin-top:6px}
  .board{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:0 36px}
  .col h3{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#8792a5;margin-bottom:12px;display:flex;justify-content:space-between}
  .tk{background:#151B24;border:1px solid #1f2632;border-radius:10px;padding:16px;margin-bottom:12px}
  .tl{display:flex;align-items:center;gap:8px;font-size:12px;color:#8792a5}.tl i{width:8px;height:8px;border-radius:50%}
  .tk p{margin:10px 0 8px;font-size:15px;line-height:1.4}.tk small{color:#8792a5;font-size:13px}
  .flow{margin:40px 36px;background:#151B24;border:1px solid #1f2632;border-radius:12px;padding:30px}
  .flow h2{font-family:SofiaC;font-weight:500;font-size:28px}
  .steps{display:flex;align-items:center;gap:14px;margin-top:24px;font-size:14px}
  .steps span{background:#0E1218;border:1px solid #2a3343;border-radius:8px;padding:14px 16px}
  .steps i{color:#3DDC97;font-style:normal}
  .toast{position:fixed;right:30px;bottom:30px;background:#E7EAF0;color:#0E1218;padding:16px 20px;border-radius:10px;font-size:14px;box-shadow:0 20px 40px rgba(0,0,0,.4);animation:up .8s 1.2s both}`,
  `<nav><b>ПОТОК</b><span class="new">+ Нова заявка</span></nav>
  <div class="kpis"><div class="kpi up"><small>Нови днес</small><b>14</b></div><div class="kpi up d1"><small>Разпределени</small><b>9</b></div><div class="kpi up d2"><small>В процес</small><b>21</b></div><div class="kpi up d3"><small>Приключени тази седмица</small><b>63</b></div></div>
  <div class="board"><div class="col"><h3>Нови <span>4</span></h3>${ticket("Не загрява бойлер", "Висок приоритет", "Лозенец · преди 5 мин", "#F06A5D")}${ticket("Монтаж на климатик", "Нормален", "Младост · преди 20 мин")}${ticket("Профилактика", "Нисък", "Център · преди 1 ч", "#8792a5")}</div>
  <div class="col"><h3>Разпределени <span>3</span></h3>${ticket("Теч под мивка", "Нормален", "Техник: Петров · 14:00")}${ticket("Смяна на термостат", "Нормален", "Техник: Илиев · 16:30")}</div>
  <div class="col"><h3>В процес <span>5</span></h3>${ticket("Ремонт на котел", "Висок приоритет", "Техник: Стоянов · на място", "#F06A5D")}${ticket("Почистване на климатик", "Нормален", "Техник: Петров")}</div>
  <div class="col"><h3>Приключени <span>12</span></h3>${ticket("Смяна на филтър", "Готово", "Клиентът е уведомен", "#3DDC97")}${ticket("Диагностика", "Готово", "Клиентът е уведомен", "#3DDC97")}</div></div>
  <div class="flow"><h2>Автоматизация: нова заявка</h2><div class="steps"><span>Заявка от сайта</span><i>→</i><span>Приоритет по ключови думи</span><i>→</i><span>Техник по район</span><i>→</i><span>SMS към клиента</span></div></div>
  <div class="toast">✓ Клиентът получи SMS: техникът пристига в 14:00</div>`,
);

export const mocks = [
  { slug: "liniya-arhitekti", html: liniya },
  { slug: "glina-i-ogan", html: glina },
  { slug: "ritam-kouching", html: ritam },
  { slug: "sfera-portal", html: sfera },
  { slug: "obsidian-lampa", html: obsidian },
  { slug: "potok-zayavki", html: potok },
];
