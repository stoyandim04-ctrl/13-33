/** The bottle's silhouette as a single drawn line (the 3D model arrives in phase 4). */
export default function BottleLine({ className = "", strokeWidth = 1 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 200 360" className={className} fill="none" aria-hidden>
      {/* cap */}
      <path
        data-draw
        pathLength={1}
        d="M78 18 L122 18 L130 34 L130 92 L70 92 L70 34 Z M70 52 L130 52 M70 72 L130 72 M100 18 L100 92"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      {/* neck */}
      <path data-draw pathLength={1} d="M86 92 L86 116 M114 92 L114 116" stroke="currentColor" strokeWidth={strokeWidth} />
      {/* body */}
      <path
        data-draw
        pathLength={1}
        d="M86 116 C 46 120, 30 134, 30 168 L30 300 C 30 330, 46 342, 76 342 L124 342 C 154 342, 170 330, 170 300 L170 168 C 170 134, 154 120, 114 116 Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      {/* liquid line */}
      <path data-draw pathLength={1} d="M36 196 C 70 190, 130 202, 164 196" stroke="currentColor" strokeWidth={strokeWidth} opacity="0.6" />
    </svg>
  );
}
