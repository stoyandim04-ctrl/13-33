/**
 * A full-bleed film plate: the 16:9 frame on desktop, the 9:16 crop on phones.
 * `name` maps to /img/<name>.webp and /img/<name>-m.webp.
 */
export default function Plate({
  name,
  className = "",
  priority = false,
  alt = "",
}: {
  name: string;
  className?: string;
  priority?: boolean;
  alt?: string;
}) {
  return (
    <picture>
      <source media="(max-width: 767px)" srcSet={`/img/${name}-m.webp`} />
      <img
        src={`/img/${name}.webp`}
        alt={alt}
        aria-hidden={alt ? undefined : true}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className={`absolute inset-0 h-full w-full object-cover ${className}`}
      />
    </picture>
  );
}
