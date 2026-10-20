# NOCTA One: reel

1. `npm run build && npm start` (port 3100 is what the script opens; change the URL in `record.mjs` otherwise).
2. Record the site frame by frame, virtual time, smooth scroll curve over the whole loop:
   `TIER=mid node social/record.mjs <frames-dir> 20 30 0 600 1280 720`
   (args: seconds, fps, first frame, last frame, width, height; run several ranges in parallel).
3. Put it on the laptop: `python3 social/composite.py social/laptop.png <frames-dir> reel.mp4 30`
   → 1080×1920, H.264. `laptop.png` is a Higgsfield photo with a chroma-green screen; the
   script finds the screen, swaps in the frames and rebuilds the reflections on the desk.
