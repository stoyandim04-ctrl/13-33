#!/usr/bin/env bash
# Puts the recorded frames on a plain warm-paper background as a rounded
# "screen" with a soft shadow and the 13:33 pill below: 1080×1920, 30 fps,
# H.264. Run social/render-badge.mjs first (it writes social/out/badge.png).
#   bash social/compose-reel.sh social/out/frames social/out/rosa-1903-reel.mp4
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
FRAMES=${1:-social/out/frames}
OUT=${2:-social/out/rosa-1903-reel.mp4}
TMP=$(mktemp -d)
CW=940; CH=$((CW * 900 / 1440)); R=30          # card size and corner radius
X=$(((1080 - CW) / 2)); Y=$(((1920 - CH) / 2 - 90))
BG='#ECE7DF'

# rounded-corner mask and the shadow under the card
convert -size ${CW}x${CH} xc:black -fill white -draw "roundrectangle 0,0,$((CW-1)),$((CH-1)),$R,$R" "$TMP/mask.png"
convert -size 1080x1920 "xc:$BG" \
  \( -size ${CW}x${CH} xc:none -fill 'rgba(40,28,22,0.55)' -draw "roundrectangle 0,0,$((CW-1)),$((CH-1)),$R,$R" \
     -background none -gravity center -extent $((CW+200))x$((CH+200)) -blur 0x34 \) \
  -gravity northwest -geometry +$((X-100))+$((Y-100+34)) -composite \
  "$HERE/out/badge.png" -gravity south -geometry +0+250 -composite "$TMP/bg.png"

ffmpeg -v error -y -loop 1 -i "$TMP/bg.png" -framerate 30 -i "$FRAMES/%04d.png" -i "$TMP/mask.png" \
  -filter_complex "[1:v]scale=${CW}:${CH}:flags=lanczos,format=rgba[s];[2:v]format=gray[m];[s][m]alphamerge[card];[0:v][card]overlay=${X}:${Y}:shortest=1,format=yuv420p" \
  -r 30 -c:v libx264 -preset slow -crf 17 -movflags +faststart "$OUT"
rm -rf "$TMP"
echo "$OUT"
