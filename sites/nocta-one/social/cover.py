"""NOCTA One reel cover: photo + type. usage: python3 -I cover.py photo.png out.png"""
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

photo, out = sys.argv[1:3]
W, H = 1080, 1920

img = Image.open(photo).convert("RGB")
s = W / img.width
img = img.resize((W, round(img.height * s)), Image.LANCZOS)
img = img.crop((0, img.height - H, W, img.height))
img = img.filter(ImageFilter.UnsharpMask(radius=1.6, percent=60, threshold=2))

# darken the sky a touch so the type sits on clean night
a = np.asarray(img).astype(np.float32)
y = np.linspace(0, 1, H)[:, None, None]
a *= 1 - 0.35 * np.clip(1 - y / 0.42, 0, 1) ** 1.5
img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def font(path, size, wght):
    f = ImageFont.truetype(path, size, layout_engine=ImageFont.Layout.RAQM)
    f.path, f._w = path, wght
    try:
        f.set_variation_by_axes([wght])
    except Exception:
        pass
    return f


from fontTools.ttLib import TTFont

_cmaps = {}
_twins = {"man-cyr.ttf": "man-lat.ttf", "jb-cyr.ttf": "jb-lat.ttf", "man-lat.ttf": "man-cyr.ttf", "jb-lat.ttf": "jb-cyr.ttf"}
_fonts = {}


def pick(f, ch):
    """the subset fonts split scripts; fall back to the twin for missing glyphs"""
    path = f.path
    cm = _cmaps.setdefault(path, TTFont(path).getBestCmap())
    if ord(ch) in cm or ch == " ":
        return f
    twin = _twins[path]
    key = (twin, f.size, getattr(f, "_w", 400))
    if key not in _fonts:
        _fonts[key] = font(twin, f.size, getattr(f, "_w", 400))
    return _fonts[key]


def run_width(parts, tracking):
    w = 0
    for text, f in parts:
        for ch in text:
            w += pick(f, ch).getlength(ch, language="bg") + tracking * f.size
    return w - tracking * parts[-1][1].size


def draw_run(d, x, y, parts, fill, tracking):
    for text, f in parts:
        for ch in text:
            g = pick(f, ch)
            d.text((x, y), ch, font=g, fill=fill, language="bg")
            x += g.getlength(ch, language="bg") + tracking * f.size


d = ImageDraw.Draw(img, "RGBA")
MC, ML = "man-cyr.ttf", "man-lat.ttf"
JL, JC = "jb-lat.ttf", "jb-cyr.ttf"

# eyebrow (mono, latin + cyrillic pieces)
eb = [("13:33 DIGITAL STUDIO   ·   ", font(JL, 25, 500)), ("КОНЦЕПЦИЯ", font(JC, 25, 500))]
w = run_width(eb, 0.22)
draw_run(d, (W - w) / 2, 178, eb, (242, 246, 250, 165), 0.22)

# headline
head = font(MC, 112, 600)
for i, line in enumerate(["Тишина,", "проектирана."]):
    parts = [(line, head)]
    w = run_width(parts, -0.035)
    draw_run(d, (W - w) / 2, 222 + i * 114, parts, (242, 246, 250, 255), -0.035)

# subline
sub = font(MC, 33, 400)
line = "3D сайт за слушалки, които не съществуват."
w = run_width([(line, sub)], 0)
draw_run(d, (W - w) / 2, 486, [(line, sub)], (242, 246, 250, 190), 0)

# product mark at the bottom, small
mark = font(ML, 30, 700)
parts = [("NOCTA ONE", mark)]
w = run_width(parts, 0.32)
draw_run(d, (W - w) / 2, 1790, parts, (242, 246, 250, 210), 0.32)

img.save(out, optimize=True)
print("saved", out, img.size)
