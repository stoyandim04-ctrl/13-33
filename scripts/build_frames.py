"""Cut the three Higgsfield fly-through clips into the scroll film.

Usage: python3 scripts/build_frames.py seg1.mp4 seg2.mp4 seg3.mp4
Writes public/frames/{d,m}/0001.webp… and public/frames/manifest.json.
  d - landscape frames for desktop/tablet
  m - a centre crop for phones held upright (the shots are symmetrical)

Frames are picked by motion, not by time: the camera speeds up through the
doors and the lobby, and an evenly-timed cut would jump there. Each output
frame carries about the same amount of visual change, so a steady scroll
reads as a steady glide. Every clip boundary is kept exactly (the "stops").
"""
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

FRAMES = 300  # total frames in the film
D_WIDTH = 1280
D_QUALITY = 62
M_RATIO = 0.62  # crop width / height for phones
M_WIDTH = 600
M_QUALITY = 60

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "frames"
clips = [Path(p) for p in sys.argv[1:]]
assert clips, __doc__


def motion(paths: list[Path]) -> np.ndarray:
    """Mean absolute change between consecutive frames, at thumbnail size."""
    thumbs = [np.asarray(Image.open(p).convert("L").resize((160, 90)), float) for p in paths]
    d = np.array([np.abs(b - a).mean() for a, b in zip(thumbs, thumbs[1:])])
    # a floor so near-still stretches still move forward
    return np.maximum(d, np.median(d) * 0.35)


shutil.rmtree(OUT, ignore_errors=True)
(OUT / "d").mkdir(parents=True)
(OUT / "m").mkdir(parents=True)

with tempfile.TemporaryDirectory() as tmp:
    # each clip's source frames, starting on the frame the previous clip ended on
    shots: list[list[Path]] = []
    for n, clip in enumerate(clips):
        d = Path(tmp) / str(n)
        d.mkdir()
        subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(clip), str(d / "%04d.png")], check=True)
        shot = sorted(d.glob("*.png"))
        shots.append(shot if n == 0 else [shots[n - 1][-1]] + shot[1:])

    # share the frame budget by how much each clip moves
    moves = [motion(s) for s in shots]
    totals = np.array([m.sum() for m in moves])
    budget = np.maximum(2, np.round(totals / totals.sum() * (FRAMES - 1)).astype(int))

    picked: list[Path] = [shots[0][0]]
    stops = [0]
    for shot, m, k in zip(shots, moves, budget):
        cum = np.concatenate([[0], np.cumsum(m)])
        targets = np.linspace(0, cum[-1], k + 1)[1:]
        idx = np.searchsorted(cum, targets).clip(1, len(shot) - 1)
        idx[-1] = len(shot) - 1  # land exactly on the clip's last frame
        picked += [shot[i] for i in idx]
        stops.append(len(picked) - 1)

    crop = (0.0, 1.0)
    for i, src in enumerate(picked):
        im = Image.open(src).convert("RGB")
        w, h = im.size
        im.resize((D_WIDTH, round(h * D_WIDTH / w)), Image.LANCZOS).save(
            OUT / "d" / f"{i + 1:04d}.webp", "WEBP", quality=D_QUALITY, method=5
        )
        cw = round(h * M_RATIO)
        left = (w - cw) // 2
        crop = (left / w, cw / w)
        m = im.crop((left, 0, left + cw, h))
        m.resize((M_WIDTH, round(h * M_WIDTH / cw)), Image.LANCZOS).save(
            OUT / "m" / f"{i + 1:04d}.webp", "WEBP", quality=M_QUALITY, method=5
        )

shutil.copy(OUT / "d" / "0001.webp", ROOT / "public" / "media" / "arrival-poster.webp")
manifest = {"count": len(picked), "stops": stops, "crop": [round(crop[0], 4), round(crop[1], 4)]}
(OUT / "manifest.json").write_text(json.dumps(manifest))
for s in ("d", "m"):
    size = sum(p.stat().st_size for p in (OUT / s).glob("*.webp"))
    print(s, f"{size / 1e6:.1f} MB")
print(manifest)
