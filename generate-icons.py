#!/usr/bin/env python3
"""Regenerates every icon in this folder. Requires Pillow: pip install pillow
Design: a 5x5 Pixel Grid whose lit cells spell a "P", with one violet scan cell."""
from PIL import Image, ImageDraw

BG, DIM, TEAL, VIOLET = (7, 7, 10), (26, 26, 34), (0, 212, 170), (123, 47, 255)
P = ["11110", "10001", "11110", "10000", "10000"]
GAP = 0.18                      # gap between cells, in cell units
SPAN = 5 + 4 * GAP              # grid width in cell units

def draw(size, content, brackets):
    img = Image.new("RGB", (size, size), BG)
    d = ImageDraw.Draw(img)
    unit = size * content / SPAN
    x0 = y0 = (size - unit * SPAN) / 2
    for r, row in enumerate(P):
        for c, ch in enumerate(row):
            lit = ch == "1"
            col = TEAL if lit else DIM
            if (r, c) == (4, 4):
                col, lit = VIOLET, True
            x = x0 + c * unit * (1 + GAP)
            y = y0 + r * unit * (1 + GAP)
            d.rectangle([round(x), round(y), round(x + unit) - 1, round(y + unit) - 1], fill=col)
    if brackets:                # viewfinder corners
        m = size * 0.11; L = size * 0.13; t = max(2, round(size * 0.02)); h = t / 2
        for sx in (-1, 1):
            for sy in (-1, 1):
                cx = m if sx < 0 else size - m
                cy = m if sy < 0 else size - m
                ex, ey = cx - sx * L, cy - sy * L          # far ends of the two arms
                d.rectangle([round(min(cx - h, ex)), round(cy - h), round(max(cx + h, ex)), round(cy + h)], fill=TEAL)
                d.rectangle([round(cx - h), round(min(cy - h, ey)), round(cx + h), round(max(cy + h, ey))], fill=TEAL)
    return img

draw(192, 0.50, True).save("icon-192.png")
draw(512, 0.50, True).save("icon-512.png")
draw(512, 0.46, False).save("icon-maskable-512.png")   # content stays inside the 80% safe zone
draw(180, 0.50, True).save("apple-touch-icon.png")     # opaque, iOS rounds the corners itself
draw(48, 0.84, False).save("favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

# favicon.svg
cells, unit, gap = [], 10, 1.8
for r, row in enumerate(P):
    for c, ch in enumerate(row):
        col = "#00d4aa" if ch == "1" else "#1a1a22"
        if (r, c) == (4, 4): col = "#7b2fff"
        cells.append(f'<rect x="{c*(unit+gap):.1f}" y="{r*(unit+gap):.1f}" width="{unit}" height="{unit}" fill="{col}"/>')
span = 5 * unit + 4 * gap
pad = 6
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-pad} {-pad} {span+2*pad:.1f} {span+2*pad:.1f}" shape-rendering="crispEdges">'
       f'<rect x="{-pad}" y="{-pad}" width="{span+2*pad:.1f}" height="{span+2*pad:.1f}" fill="#07070a"/>' + "".join(cells) + "</svg>\n")
open("favicon.svg", "w").write(svg)
print("icons written")
