"""Vyrenderuje stránky montážního návodu a výřezy ke krokům do app/public/manual/.

Použití:  python -I tools/manual_images.py   (vyžaduje balíček pymupdf)
"""
import os
import sys

import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(ROOT, "Domek Herold P 3322_A_Návod (1).pdf")
OUT = os.path.join(ROOT, "app", "public", "manual")

# výřezy: id -> (strana od 1, x0, y0, x1, y1 v bodech PDF)
CROPS = {
    "prep": (2, 0, 385, 595, 560),
    "overview": (7, 0, 300, 842, 1150),
    "s1": (8, 0, 30, 842, 560),
    "s2": (8, 0, 520, 842, 1150),
    "s3": (9, 0, 40, 842, 470),
    "s4": (9, 0, 460, 842, 1150),
    "s5": (10, 0, 40, 842, 1150),
    "s6": (11, 0, 40, 842, 1150),
    "s7": (12, 0, 40, 842, 1150),
    "s8": (13, 0, 40, 842, 1150),
    "s9": (14, 0, 40, 842, 1150),
    "s10": (15, 0, 40, 842, 1150),
}

os.makedirs(OUT, exist_ok=True)
doc = pymupdf.open(PDF)
for i, page in enumerate(doc):
    page.get_pixmap(dpi=110).save(os.path.join(OUT, f"page-{i + 1:02d}.png"))
for key, (p, x0, y0, x1, y1) in CROPS.items():
    doc[p - 1].get_pixmap(dpi=140, clip=pymupdf.Rect(x0, y0, x1, y1)).save(os.path.join(OUT, f"{key}.png"))
print("ok", len(doc), "stran,", len(CROPS), "výřezů", file=sys.stderr)
