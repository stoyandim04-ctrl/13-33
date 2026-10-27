import { useState, type FormEvent } from "react";

/*
  Сайтът след филма: калибърът в числа, ръчната довършителна работа, цитат,
  дневник и заявка за оглед. Числата са тези на механизма от филма (movement.ts).
  KAIROS е концепция — формите не изпращат нищо и го казват честно.
*/

const SPECS: [string, string][] = [
  ["Frequency", "18,000 vph · 2.5 Hz"],
  ["Power reserve", "48 hours"],
  ["Winding", "By hand, at the crown"],
  ["Jewels", "14 rubies"],
  ["Escapement", "Swiss lever, 15-tooth escape wheel"],
  ["Gear train", "Barrel 80 · Centre 80/10 · Third 75/10 · Fourth 80/10 · Escape 15/8"],
  ["Balance", "Gold, 16 timing screws, blued hairspring"],
  ["Case", "Platinum, 38 mm, sapphire front and back"],
];

const FINISHES = [
  {
    img: "img/balance.jpg",
    title: "Côtes de Genève",
    body: "Straight bands drawn across every bridge, so light runs over the steel like water. You passed under them in chapter III.",
  },
  {
    img: "img/train.jpg",
    title: "Perlage",
    body: "Thousands of overlapping circles on the main plate. Nobody sees them once the watch is cased — except through the back.",
  },
  {
    img: "img/spring.jpg",
    title: "Blued steel",
    body: "Screws, hairspring and mainspring are heated until the steel turns a deep blue. The colour is the temperature, held.",
  },
];

const JOURNAL = [
  {
    tag: "Mechanics",
    title: "Why 18,000 beats an hour",
    excerpt: "A slower balance is calmer to look at and kinder to the oil.",
    more: [
      "Most modern watches beat at 28,800 an hour. K-13 runs slower, at 18,000: five beats a second, the rhythm of older pocket watches.",
      "The balance swings wider and the escapement wears less. You hear it as a softer, rounder tick — the sound you heard on the way in.",
    ],
  },
  {
    tag: "Materials",
    title: "Rubies, and why a watch needs them",
    excerpt: "Fourteen synthetic rubies take the friction so the steel doesn't have to.",
    more: [
      "Eleven hold the pivots of the wheels. Ruby is harder than the steel that turns in it, and it keeps a drop of oil exactly where it is needed.",
      "Two more sit on the pallet fork — the only parts that touch the escape wheel, five times a second, for years. The fourteenth is the impulse pin under the balance.",
    ],
  },
  {
    tag: "Name",
    title: "Kairos and Chronos",
    excerpt: "The Greeks had two words for time. We named the watch after the second.",
    more: [
      "Chronos is time that passes: seconds, hours, the hands going round. Kairos is the right moment — the one you act on.",
      "A watch can only measure the first. We made one that reminds you of the second.",
    ],
  },
];

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="mono eyebrow">
      {children} <span className="rule" />
    </p>
  );
}

export function Calibre() {
  return (
    <section id="calibre" className="sec">
      <div className="wrap split">
        <div>
          <Eyebrow>Calibre K-13</Eyebrow>
          <h2 className="h2">Everything you passed, in numbers.</h2>
          <p className="p">
            A hand-wound movement with an open caseback and an open barrel. Every figure below is the movement you just flew through — the
            wheels on this page are cut to these tooth counts and turn at these speeds.
          </p>
          <div className="actions">
            <a className="pill" href="#viewing">
              Book a private viewing
            </a>
            <a className="mono link" href="#atelier">
              How it is finished ↓
            </a>
          </div>
        </div>
        <figure className="shot">
          <img src="img/caseback.jpg" alt="Calibre K-13 seen through the sapphire caseback" loading="lazy" />
          <figcaption className="mono">Calibre K-13 · through the sapphire caseback</figcaption>
        </figure>
      </div>
      <dl className="wrap specs">
        {SPECS.map(([k, v]) => (
          <div key={k} className="spec">
            <dt className="mono">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Atelier() {
  return (
    <section id="atelier" className="sec">
      <div className="wrap">
        <Eyebrow>The atelier</Eyebrow>
        <h2 className="h2 narrow">What the light catches.</h2>
        <p className="p narrow">Three finishes, done by hand, on parts most owners will only ever see through the caseback.</p>
        <div className="cards">
          {FINISHES.map((f) => (
            <article key={f.title} className="card">
              <img src={f.img} alt="" loading="lazy" />
              <h3 className="h3">{f.title}</h3>
              <p className="p small">{f.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Quote() {
  return (
    <section className="quote" aria-label="Kairos">
      <img src="img/dial.jpg" alt="" loading="lazy" />
      <div className="wrap quote-in">
        <p className="mono eyebrow">καιρός</p>
        <blockquote className="q">Not the time on the dial — the right moment to act.</blockquote>
      </div>
    </section>
  );
}

export function Journal() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="journal" className="sec">
      <div className="wrap">
        <div className="head-row">
          <div>
            <Eyebrow>Journal</Eyebrow>
            <h2 className="h2">Notes from the bench.</h2>
          </div>
          <a className="mono link" href="#viewing">
            Ask us anything →
          </a>
        </div>
        <div className="posts">
          {JOURNAL.map((j, i) => (
            <article key={j.title} className={`post ${open === i ? "is-open" : ""}`}>
              <p className="mono tag">{j.tag}</p>
              <h3 className="h3">{j.title}</h3>
              <p className="p small">{j.excerpt}</p>
              <div className="more" hidden={open !== i}>
                {j.more.map((m) => (
                  <p key={m} className="p small">
                    {m}
                  </p>
                ))}
              </div>
              <button type="button" className="mono link" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                {open === i ? "Close" : "Read"} {open === i ? "↑" : "→"}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Viewing() {
  const [sent, setSent] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };
  return (
    <section id="viewing" className="sec">
      <div className="wrap split">
        <div>
          <Eyebrow>Private viewings</Eyebrow>
          <h2 className="h2">See it in your hand.</h2>
          <p className="p">
            K-13 is shown by appointment, one person at a time, with the caseback open and a loupe on the table. Tell us where you are and we
            will find a moment.
          </p>
        </div>
        {sent ? (
          <div className="form sent" role="status">
            <p className="h3">Thank you.</p>
            <p className="p small">KAIROS is a concept, so nothing was sent — but this is where your request would land.</p>
            <button type="button" className="mono link" onClick={() => setSent(false)}>
              Back to the form
            </button>
          </div>
        ) : (
          <form className="form" onSubmit={submit}>
            <label className="field">
              <span className="mono">Name</span>
              <input id="v-name" name="name" required autoComplete="name" />
            </label>
            <label className="field">
              <span className="mono">E-mail</span>
              <input id="v-email" name="email" type="email" required autoComplete="email" />
            </label>
            <label className="field">
              <span className="mono">City</span>
              <input id="v-city" name="city" autoComplete="address-level2" />
            </label>
            <button type="submit" className="pill">
              Request a viewing
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export function Footer() {
  const [joined, setJoined] = useState(false);
  return (
    <footer className="foot">
      <div className="wrap foot-grid">
        <div>
          <p className="foot-mark">KAIROS</p>
          <p className="p small">Hand-wound pocket watches, made for the right moment.</p>
        </div>
        <nav className="foot-col" aria-label="Watch">
          <p className="mono">Watch</p>
          <a href="#calibre">Calibre K-13</a>
          <a href="#atelier">Atelier</a>
          <a href="#journal">Journal</a>
        </nav>
        <nav className="foot-col" aria-label="Visit">
          <p className="mono">Visit</p>
          <a href="#viewing">Private viewings</a>
          <a href="#top">Watch the film again</a>
        </nav>
        <form
          className="foot-col"
          onSubmit={(e) => {
            e.preventDefault();
            setJoined(true);
          }}
        >
          <p className="mono">Letters from the atelier</p>
          {joined ? (
            <p className="p small">Noted — though as a concept, KAIROS doesn't send letters.</p>
          ) : (
            <div className="news">
              <input id="news-email" type="email" required placeholder="Your e-mail" aria-label="Your e-mail" />
              <button type="submit" className="mono link">
                Join →
              </button>
            </div>
          )}
        </form>
      </div>
      <div className="wrap foot-base mono">
        <span>© KAIROS · a concept — the brand, calibre and editions are invented</span>
        <a className="link" href="https://digistudio13.com" target="_blank" rel="noreferrer">
          Concept by 13:33 ↗
        </a>
      </div>
    </footer>
  );
}
