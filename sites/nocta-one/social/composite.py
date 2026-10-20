"""
Puts the recorded site onto the laptop photo and writes a 9:16 reel.

usage: python3 -I composite.py laptop.png frames_dir out.mp4 [fps] [limit]

The photo's screen is chroma green. Its quad is found once; every recorded
frame is warped into it. The green spill on the keyboard and the glossy desk
is removed and replaced by a blurred, mirrored copy of the live screen, so
the reflections move with the site. A slow push-in and a little handheld
drift make it read as filmed on a phone.
"""
import glob
import math
import subprocess
import sys

import cv2
import numpy as np

photo_path, frames_dir, out_path = sys.argv[1:4]
FPS = int(sys.argv[4]) if len(sys.argv) > 4 else 30
LIMIT = int(sys.argv[5]) if len(sys.argv) > 5 else 0

OUT_W, OUT_H = 1080, 1920
MARGIN = 1.1  # room for the camera to move

# ---------------------------------------------------------------- photo --
src = cv2.imread(photo_path)
scale = OUT_W / src.shape[1] * MARGIN
big_w = int(round(src.shape[1] * scale))
big_h = int(round(src.shape[0] * scale))
base = cv2.resize(src, (big_w, big_h), interpolation=cv2.INTER_LANCZOS4)
# a touch of sharpening after the upscale
blur = cv2.GaussianBlur(base, (0, 0), 1.2)
base = cv2.addWeighted(base, 1.35, blur, -0.35, 0)
base = base.astype(np.float32) / 255.0

b, g, r = base[..., 0], base[..., 1], base[..., 2]
greenness = np.clip(g - np.maximum(r, b), 0, 1)

# screen: biggest strongly green blob
hard = ((g > 0.55) & (r < 0.5) & (b < 0.5)).astype(np.uint8)
n, lab, stats, _ = cv2.connectedComponentsWithStats(hard)
big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
screen = (lab == big).astype(np.uint8)
cnt = max(cv2.findContours(screen, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)[0], key=cv2.contourArea)
c = cnt.reshape(-1, 2).astype(np.float32)
s, d = c.sum(1), c[:, 0] - c[:, 1]
TL, BR, TR, BL = c[np.argmin(s)], c[np.argmax(s)], c[np.argmax(d)], c[np.argmin(d)]
# grow the quad a hair so no green rim survives at the bezel
ctr = (TL + TR + BR + BL) / 4
quad = np.float32([ctr + (p - ctr) * 1.006 for p in (TL, TR, BR, BL)])

# soft screen mask (filled convex hull of the quad, 1px feather)
smask = np.zeros((big_h, big_w), np.float32)
cv2.fillConvexPoly(smask, quad.astype(np.int32), 1.0, lineType=cv2.LINE_AA)
smask = cv2.GaussianBlur(smask, (0, 0), 0.8)[..., None]

# spill: green light elsewhere (keyboard, desk reflection)
spill = (greenness * (1 - smask[..., 0]))
spill = cv2.GaussianBlur(spill, (0, 0), 1.0)[..., None]
despilled = base.copy()
despilled[..., 1] = np.minimum(g, np.maximum(r, b) * 1.05)
# below the screen (keyboard, trackpad, desk) the wall's cyan never reaches:
# any green there is screen spill, so pull it under blue
below = (np.mgrid[0:big_h, 0:big_w][0] > min(BL[1], BR[1]) + 4)
gb = np.minimum(despilled[..., 1], np.maximum(r, b * 0.8))
despilled[..., 1] = np.where(below, gb, despilled[..., 1])
spill = np.maximum(spill, (np.clip(g - b * 0.8, 0, 1) * below)[..., None] * 0.8)

# where the screen's reflection lies: mirror the quad below its bottom edge
def mirror(p, a, bb):
    # reflect point p across the line a-b
    ab = bb - a
    t = np.dot(p - a, ab) / np.dot(ab, ab)
    foot = a + ab * t
    return foot * 2 - p

refl_quad = np.float32([mirror(TL, BL, BR), mirror(TR, BL, BR), BR, BL])
# compress the reflection a little: the desk is foreshortened
refl_quad[0] = BL + (refl_quad[0] - BL) * 0.85
refl_quad[1] = BR + (refl_quad[1] - BR) * 0.85

frames = sorted(glob.glob(frames_dir + "/f_*.png"))
if LIMIT:
    frames = frames[:LIMIT]
fh, fw = cv2.imread(frames[0]).shape[:2]
src_quad = np.float32([[0, 0], [fw, 0], [fw, fh], [0, fh]])
H_screen = cv2.getPerspectiveTransform(src_quad, quad)
# flipped frame onto the reflection quad: top of the flipped image meets the screen's bottom edge
src_flip = np.float32([[0, fh], [fw, fh], [fw, 0], [0, 0]])
H_refl = cv2.getPerspectiveTransform(src_flip, np.float32([refl_quad[3], refl_quad[2], refl_quad[1], refl_quad[0]]))

# glass sheen: a faint diagonal highlight across the screen
yy, xx = np.mgrid[0:big_h, 0:big_w].astype(np.float32)
sheen = np.exp(-(((xx - quad[0][0]) * 0.55 - (yy - quad[0][1]) + 40) / 140.0) ** 2) * 0.05
sheen = (sheen[..., None] * smask).astype(np.float32)

# vignette for the output frame
oy, ox = np.mgrid[0:OUT_H, 0:OUT_W].astype(np.float32)
vig = 1 - 0.38 * (((ox - OUT_W / 2) / (OUT_W / 2)) ** 2 * 0.6 + ((oy - OUT_H / 2) / (OUT_H / 2)) ** 2) ** 1.2
vig = np.clip(vig, 0, 1)[..., None].astype(np.float32)

ff = subprocess.Popen(
    [
        "ffmpeg", "-v", "error", "-y",
        "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{OUT_W}x{OUT_H}", "-r", str(FPS), "-i", "-",
        "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", out_path,
    ],
    stdin=subprocess.PIPE,
)

rng = np.random.default_rng(7)
N = len(frames)
small = (big_w // 4, big_h // 4)
for i, fp in enumerate(frames):
    t = i / FPS
    fr = cv2.imread(fp).astype(np.float32) / 255.0
    # screens glow a little brighter than a capture
    fr = np.clip(fr * 1.08 + 0.01, 0, 1)

    warped = cv2.warpPerspective(fr, H_screen, (big_w, big_h), flags=cv2.INTER_CUBIC)
    img = despilled * (1 - smask) + warped * smask + sheen

    # reflections: mirrored + blurred screen where the green spill was
    refl = cv2.warpPerspective(fr, H_refl, (big_w, big_h), flags=cv2.INTER_LINEAR)
    refl = cv2.resize(refl, small, interpolation=cv2.INTER_AREA)
    refl = cv2.GaussianBlur(refl, (0, 0), 9)
    refl = cv2.resize(refl, (big_w, big_h), interpolation=cv2.INTER_LINEAR)
    # plus the screen's overall light for the keyboard
    glow = cv2.resize(warped, small, interpolation=cv2.INTER_AREA)
    glow = cv2.GaussianBlur(glow, (0, 0), 30)
    glow = cv2.resize(glow, (big_w, big_h), interpolation=cv2.INTER_LINEAR)
    img = img + spill * (refl * 2.2 + glow * 1.6) + glow * 0.05 * (1 - smask)

    # camera: slow push-in, handheld drift and roll
    zoom = 1.0 + 0.055 * (0.5 - 0.5 * math.cos(math.pi * min(1.0, t / (N / FPS))))
    dx = 7 * math.sin(t * 0.63) + 3 * math.sin(t * 1.71 + 0.4) + 1.2 * math.sin(t * 4.1)
    dy = 6 * math.sin(t * 0.81 + 1.1) + 2.5 * math.sin(t * 2.07) + 1.0 * math.sin(t * 3.7 + 2)
    rot = 0.32 * math.sin(t * 0.52) + 0.1 * math.sin(t * 1.33)
    cx = big_w / 2 + dx
    cy = big_h * 0.47 + dy
    M = cv2.getRotationMatrix2D((cx, cy), rot, zoom * (OUT_W / (big_w / MARGIN)) / 1.0)
    M[0, 2] += OUT_W / 2 - cx
    M[1, 2] += OUT_H / 2 - cy
    out = cv2.warpAffine(img, M, (OUT_W, OUT_H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)

    out = out * vig
    out += rng.normal(0, 0.012, out.shape).astype(np.float32)  # phone sensor grain
    out8 = np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8)
    ff.stdin.write(out8.tobytes())
    if i % 60 == 0:
        print("frame", i, "/", N, flush=True)

ff.stdin.close()
ff.wait()
print("wrote", out_path)
