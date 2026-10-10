"""Cut the three Higgsfield fly-through clips into the scroll film.

Usage: python3 scripts/build_frames.py seg1.mp4 seg2.mp4 seg3.mp4
Writes public/frames/{d,m}/0001.webp… and public/frames/manifest.json.
  d - landscape frames for desktop/tablet
  m - a centre crop for phones held upright (the shots are symmetrical)
"""
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from PIL import Image

FPS = 8
D_WIDTH = 1366
M_RATIO = 0.62  # crop width / height for phones
M_WIDTH = 640

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "frames"
clips = [Path(p) for p in sys.argv[1:]]
assert clips, __doc__

shutil.rmtree(OUT, ignore_errors=True)
(OUT / "d").mkdir(parents=True)
(OUT / "m").mkdir(parents=True)

frames: list[Path] = []
stops = [0]
with tempfile.TemporaryDirectory() as tmp:
    for n, clip in enumerate(clips):
        d = Path(tmp) / str(n)
        d.mkdir()
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-i", str(clip), "-vf", f"fps={FPS},hqdn3d=2:2:6:6", str(d / "%04d.png")],
            check=True,
        )
        shot = sorted(d.glob("*.png"))
        # each clip starts on the previous clip's last frame - keep it once
        if n > 0:
            shot = shot[1:]
        frames += shot
        stops.append(len(frames) - 1)

    crop = (0.0, 1.0)
    for i, src in enumerate(frames):
        im = Image.open(src).convert("RGB")
        w, h = im.size
        im.resize((D_WIDTH, round(h * D_WIDTH / w)), Image.LANCZOS).save(
            OUT / "d" / f"{i + 1:04d}.webp", "WEBP", quality=60, method=5
        )
        cw = round(h * M_RATIO)
        left = (w - cw) // 2
        crop = (left / w, cw / w)
        m = im.crop((left, 0, left + cw, h))
        m.resize((M_WIDTH, round(h * M_WIDTH / cw)), Image.LANCZOS).save(
            OUT / "m" / f"{i + 1:04d}.webp", "WEBP", quality=58, method=5
        )

shutil.copy(OUT / "d" / "0001.webp", ROOT / "public" / "media" / "arrival-poster.webp")
manifest = {"count": len(frames), "stops": stops, "crop": [round(crop[0], 4), round(crop[1], 4)]}
(OUT / "manifest.json").write_text(json.dumps(manifest))
size = sum(p.stat().st_size for p in OUT.rglob("*.webp"))
print(manifest, f"{size / 1e6:.1f} MB total")
