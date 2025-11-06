#!/usr/bin/env bash
set -euo pipefail

# Generate PNG icons from SVG sources (requires ImageMagick `convert`)
# Usage: ./scripts/generate-icons.sh

SRC_DIR="icons"
OUT_DIR="icons"

declare -A SIZES=( [192]=192 [512]=512 )

for size in "${!SIZES[@]}"; do
  svg="$SRC_DIR/icon-${size}.svg"
  png="$OUT_DIR/icon-${size}.png"
  if [ -f "$svg" ]; then
    if command -v convert >/dev/null 2>&1; then
      echo "Generating $png from $svg (size ${SIZES[$size]})"
      convert "$svg" -background none -resize ${SIZES[$size]}x${SIZES[$size]} "$png"
    else
      echo "ImageMagick 'convert' not found — cannot generate $png. Install ImageMagick or convert manually."
    fi
  else
    echo "Source $svg not found — skipping $png"
  fi
done

echo "Done. If PNGs were not generated, install ImageMagick (e.g., sudo apt install imagemagick) and re-run this script." 
