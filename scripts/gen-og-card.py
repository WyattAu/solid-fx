#!/usr/bin/env python3
"""Generate the solid-fx og:image social card (1200x630).

Deterministic brand asset — PIL composition, no generation models. Source
of truth for the card: assets/og-card.png (copied into the SSG assets by
scripts/build-islands.mjs and referenced from docs-site-src/site.toml).

Usage: python3 scripts/gen-og-card.py
"""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
SKY = (56, 189, 248)  # #38bdf8 — site accent
OUT = "assets/og-card.png"

img = Image.new("RGB", (W, H))
draw = ImageDraw.Draw(img)

# Vertical gradient #0a0e18 -> #131c2e
top, bottom = (10, 14, 24), (19, 28, 46)
for y in range(H):
    t = y / H
    draw.line([(0, y), (W, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)))

# Faint grid: 60px pitch, 6% sky
for x in range(0, W, 60):
    draw.line([(x, 0), (x, H)], fill=(20, 36, 54))
for y in range(0, H, 60):
    draw.line([(0, y), (W, y)], fill=(20, 36, 54))

# Accent bar
draw.rectangle([0, H - 12, W, H], fill=SKY)

inter = "/home/wyatt/.local/share/fonts/Inter.ttf"

def font(size):
    return ImageFont.truetype(inter, size)

def width(f, s):
    b = draw.textbbox((0, 0), s, font=f)
    return b[2] - b[0]

# Wordmark
t1 = "solid-fx"
f1 = font(132)
draw.text((96, 150), t1, font=f1, fill=(241, 245, 249))
draw.rectangle([96, 312, 96 + width(f1, t1), 324], fill=SKY)

# Subtitle
sub = "400+ SolidJS components — source you own"
f2 = font(44)
draw.text((96, 372), sub, font=f2, fill=(148, 163, 184))

# Chips
f3 = font(28)
chips = ["react-bits ×218", "instruments", "GPU frontier", "emergent"]
x = 96
for c in chips:
    w = width(f3, c)
    draw.rounded_rectangle([x, 470, x + w + 44, 522], radius=12, outline=SKY, width=2)
    draw.text((x + 22, 482), c, font=f3, fill=(186, 230, 253))
    x += w + 44 + 24

# Origin
f4 = font(26)
origin = "wyattau.github.io/solid-fx"
draw.text((W - 96 - width(f4, origin), H - 68), origin, font=f4, fill=(100, 116, 139))

img.save(OUT)
print(f"wrote {OUT} ({W}x{H})")
