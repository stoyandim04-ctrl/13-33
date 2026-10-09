import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="section flex min-h-svh items-center">
      <div className="container-wide">
        <p className="eyebrow mb-5">404</p>
        <h1 className="font-display text-heading font-[500] tracking-[-0.045em]">Тази страница не съществува.</h1>
        <Link to="/" className="text-foreground hover:text-ice mt-8 inline-block border-b border-current pb-0.5">
          Към началото
        </Link>
      </div>
    </section>
  );
}
