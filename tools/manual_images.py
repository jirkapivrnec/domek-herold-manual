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

# detaily z výkresů: písmeno -> (strana, x0, y0, x1, y1)
DETAILS = {
    "AB": (8, 498, 395, 832, 590),
    "C": (8, 300, 570, 485, 722),
    "D": (8, 475, 990, 752, 1140),
    "E": (9, 398, 265, 590, 474),
    "J": (9, 78, 880, 272, 1110),
    "G": (10, 265, 62, 480, 320),
    "H": (10, 58, 838, 272, 1088),
    "I": (10, 528, 830, 752, 1078),
    "L": (11, 40, 255, 272, 494),
    "K": (11, 44, 550, 316, 862),
    "N": (12, 40, 105, 258, 378),
    "M": (12, 58, 608, 234, 828),
    "OP": (13, 92, 820, 734, 1074),
    "Q": (14, 332, 115, 700, 465),
}

os.makedirs(OUT, exist_ok=True)
doc = pymupdf.open(PDF)
for i, page in enumerate(doc):
    page.get_pixmap(dpi=110).save(os.path.join(OUT, f"page-{i + 1:02d}.png"))
for key, (p, x0, y0, x1, y1) in CROPS.items():
    doc[p - 1].get_pixmap(dpi=140, clip=pymupdf.Rect(x0, y0, x1, y1)).save(os.path.join(OUT, f"{key}.png"))
for key, (p, x0, y0, x1, y1) in DETAILS.items():
    doc[p - 1].get_pixmap(dpi=200, clip=pymupdf.Rect(x0, y0, x1, y1)).save(os.path.join(OUT, f"detail-{key}.png"))
print("ok", len(doc), "stran,", len(CROPS), "výřezů", file=sys.stderr)
