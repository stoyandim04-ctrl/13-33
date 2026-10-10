"""Turn the Higgsfield source renders into web-sized WebP stills.

Usage: python3 scripts/build_stills.py <dir with the source PNGs>
Sources are the generated keyframes and stills (not committed - too large).
"""
import sys
from pathlib import Path
from PIL import Image

SRC = Path(sys.argv[1])
OUT = Path(__file__).resolve().parent.parent / "public" / "media"
OUT.mkdir(parents=True, exist_ok=True)

# source name -> (output name, max width)
JOBS = {
    "m1": ("material-travertine", 1100),
    "m2": ("material-oak", 1100),
    "m3": ("material-linen", 1100),
    "r1": ("residence-garden", 1920),
    "r2": ("residence-terrace", 1920),
    "r3": ("residence-penthouse", 1920),
    "k1b": ("evening", 2400),
    "k1a": ("arrival-poster", 1920),
}

for src, (name, width) in JOBS.items():
    im = Image.open(SRC / f"{src}.png").convert("RGB")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(OUT / f"{name}.webp", "WEBP", quality=80, method=6)
    print(name, im.size, (OUT / f"{name}.webp").stat().st_size // 1024, "KB")
