import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";

import { getProject, projects, STATUS_LABEL, STATUS_NOTE } from "@/data/projects";
import { useReducedMotion } from "@/hooks/use-media";
import NotFound from "@/pages/not-found";

export default function ProjectPage() {
  const { slug } = useParams();
  const project = getProject(slug);
  const reduced = useReducedMotion();
  const [videoFailed, setVideoFailed] = React.useState(false);

  React.useEffect(() => {
    if (project) document.title = `${project.name} — 13:33`;
    setVideoFailed(false);
  }, [project]);

  if (!project) return <NotFound />;

  const index = projects.indexOf(project);
  const next = projects[(index + 1) % projects.length];
  const showVideo = Boolean(project.video) && !videoFailed;

  return (
    <article className="pt-28 md:pt-36">
      <div className="px-5 sm:px-8 lg:px-14">
        <div className="container-wide">
          <Link
            to="/#proekti"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft aria-hidden="true" className="size-4" /> Всички проекти
          </Link>

          <header className="mt-12 grid gap-8 md:mt-16 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="eyebrow mb-5">
                {project.category} · {project.sector}
              </p>
              <h1 className="font-display text-heading font-[500] tracking-[-0.045em]">{project.name}</h1>
            </div>
            <div className="lg:col-span-4">
              <p className="inline-flex items-center gap-2 text-sm">
                <span className="bg-ice size-1.5 rounded-full" aria-hidden="true" />
                {STATUS_LABEL[project.status]}
              </p>
              <p className="text-muted-foreground mt-2 max-w-[40ch] text-sm">{STATUS_NOTE[project.status]}</p>
            </div>
          </header>
        </div>
      </div>

      <div className="mt-12 px-3 sm:px-8 md:mt-16 lg:px-14">
        <div className="container-wide">
          <div className="bg-surface-2 ring-foreground/10 relative aspect-[1.45] overflow-hidden rounded-md ring-1">
            <img src={project.poster} alt={`${project.name} — начален екран`} className="absolute inset-0 size-full object-cover" />
            {showVideo ? (
              <video
                key={project.slug}
                poster={project.poster}
                muted
                loop
                playsInline
                autoPlay={!reduced}
                controls={reduced}
                preload={reduced ? "none" : "auto"}
                // Only the element's own error counts: an MP4 source a browser
                // cannot decode reports an error too, and then the WebM plays.
                onError={(e) => {
                  if (e.target === e.currentTarget) setVideoFailed(true);
                }}
                aria-label={`${project.name} — запис на разглеждане на сайта`}
                className="absolute inset-0 size-full object-cover"
              >
                {project.video?.mp4 ? <source src={project.video.mp4} type="video/mp4" /> : null}
                {project.video?.webm ? (
                  <source src={project.video.webm} type="video/webm" onError={() => setVideoFailed(true)} />
                ) : null}
              </video>
            ) : null}
          </div>
        </div>
      </div>

      <div className="section pt-20 md:pt-28">
        <div className="container-wide grid gap-16 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <p className="font-display text-title font-[500] tracking-[-0.025em] text-balance">{project.summary}</p>
            <h2 className="eyebrow mt-14 mb-4">Бизнес нуждата</h2>
            <p className="text-muted-foreground max-w-[58ch] text-pretty">{project.need}</p>
            <h2 className="eyebrow mt-14 mb-2">Решението</h2>
            <ul>
              {project.approach.map((a) => (
                <li key={a} className="hairline max-w-[60ch] py-5 text-pretty">
                  {a}
                </li>
              ))}
            </ul>
          </div>

          <aside className="lg:col-span-4 lg:col-start-9">
            <h2 className="eyebrow mb-4">{project.status === "concept" ? "Какво обхваща концепцията" : "Нашата роля"}</h2>
            <ul className="space-y-2">
              {project.role.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            {project.year ? (
              <>
                <h2 className="eyebrow mt-10 mb-4">Година</h2>
                <p>{project.year}</p>
              </>
            ) : null}
            <div className="mt-10">
              {project.liveUrl ? (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-foreground/25 hover:border-foreground/60 inline-flex h-12 items-center gap-2 rounded-full border px-6 font-medium transition-colors"
                >
                  Отвори сайта <ArrowUpRight aria-hidden="true" className="size-4" />
                </a>
              ) : (
                <p className="text-muted-foreground text-sm">Няма публична версия на този проект.</p>
              )}
            </div>
          </aside>
        </div>
      </div>

      <div className="px-5 pb-28 sm:px-8 md:pb-40 lg:px-14">
        <div className="container-wide grid gap-10 md:grid-cols-2">
          <Link to={`/proekti/${next.slug}`} className="group hairline block pt-8">
            <p className="eyebrow mb-4">Следващ проект</p>
            <p className="font-display text-title flex items-center gap-3 font-[500] transition-colors group-hover:text-ice">
              {next.name}
              <ArrowRight aria-hidden="true" className="size-5 transition-transform duration-500 group-hover:translate-x-1" />
            </p>
          </Link>
          <Link to="/#kontakt" className="group hairline block pt-8">
            <p className="eyebrow mb-4">Имаш подобна нужда?</p>
            <p className="font-display text-title flex items-center gap-3 font-[500] transition-colors group-hover:text-ice">
              Започни проект
              <ArrowRight aria-hidden="true" className="size-5 transition-transform duration-500 group-hover:translate-x-1" />
            </p>
          </Link>
        </div>
      </div>
    </article>
  );
}
