"""
Domek Herold P 3322_A – parametrický 3D model pro interaktivní návod.

Spouští se v Blenderu (přes MCP nebo `blender --background --python build_herold.py`).
Všechny rozměry jsou v mm a pochází z montážního návodu (str. 1, 3–5, 8–16).
Model vytvoří scénu "Herold" a vyexportuje ji do app/public/models/herold.glb.

Souřadnice (Blender, Z nahoru):
  X … délka domku 0 → 3270 (čelní stěna s dveřmi, zleva doprava při pohledu zepředu)
  Y … hloubka 0 → 2210 (Y=0 vnější líc čelních sloupků, Y=2210 vnější líc zadních sloupků)
  Z … výška, Z=0 horní plocha dřevěné podlahy na plošině (spodní plocha gumových podložek)

Každý objekt nese vlastní vlastnosti (glTF extras), které čte React aplikace:
  part  – číslo pozice dle soupisu materiálu (1–43, 0 = plošina, -1 = otvor pro vrut)
  step  – id kroku, ve kterém se díl objeví
  until – (volitelně) id kroku, od kterého se díl skryje (např. neproříznutý modul)
  grp   – rám, ke kterému díl patří (rear/front/sideL/sideR) – kvůli rozloženému pohledu
  kind  – materiál (wood, deck, floor, steel, rubber, glass, hole, logo)
  fx,fy,fz – odkud díl přilétá při animaci (mm, relativně)
"""
import math
import os

import bmesh
import bpy

S = 0.001
HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in dir() else "/Users/jp/Dev/Domek Herold/blender"
OUT_GLB = os.path.join(os.path.dirname(HERE), "app", "public", "models", "herold.glb")
SCENE = "Herold"

# --------------------------------------------------------------------------- scéna
old = bpy.data.scenes.get(SCENE)
if old:
    for o in list(old.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.scenes.remove(old)
for me in list(bpy.data.meshes):
    if me.name.startswith("H_") and me.users == 0:
        bpy.data.meshes.remove(me)
scene = bpy.data.scenes.new(SCENE)
scene.unit_settings.system = "METRIC"
bpy.context.window.scene = scene


def material(name, rgb, metallic=0.0, rough=0.8, alpha=1.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = rough
    b.inputs["Alpha"].default_value = alpha
    if alpha < 1:
        try:
            m.surface_render_method = "BLENDED"
        except AttributeError:
            m.blend_method = "BLEND"
    return m


MATS = {
    "wood": material("H_wood", (0.80, 0.64, 0.42)),
    "deck": material("H_deck", (0.30, 0.29, 0.27)),
    "floor": material("H_floor", (0.55, 0.42, 0.30)),
    "steel": material("H_steel", (0.62, 0.63, 0.65), metallic=0.8, rough=0.35),
    "rubber": material("H_rubber", (0.04, 0.04, 0.04)),
    "glass": material("H_glass", (0.70, 0.85, 0.92), rough=0.05, alpha=0.35),
    "hole": material("H_hole", (0.02, 0.02, 0.02)),
    "logo": material("H_logo", (0.12, 0.35, 0.18)),
}


# --------------------------------------------------------------------------- geometrie
class Mesh:
    """Sbírá kvádry / hranoly do jednoho bmesh; finish() z něj udělá objekt."""

    def __init__(self):
        self.bm = bmesh.new()

    def _v(self, x, y, z):
        return self.bm.verts.new((x * S, y * S, z * S))

    def box(self, x0, x1, y0, y1, z0, z1):
        x0, x1 = sorted((x0, x1))
        y0, y1 = sorted((y0, y1))
        z0, z1 = sorted((z0, z1))
        v = [self._v(*p) for p in [
            (x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
            (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]]
        for f in [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]:
            self.bm.faces.new([v[i] for i in f])
        return self

    def _prism(self, pts, a0, a1, to3d):
        a = [self._v(*to3d(p, a0)) for p in pts]
        b = [self._v(*to3d(p, a1)) for p in pts]
        self.bm.faces.new(a)
        self.bm.faces.new(b)
        n = len(pts)
        for i in range(n):
            j = (i + 1) % n
            self.bm.faces.new([a[i], a[j], b[j], b[i]])
        return self

    def prism_yz(self, pts, x0, x1):
        """Profil v rovině YZ vytažený podél X."""
        return self._prism(pts, x0, x1, lambda p, x: (x, p[0], p[1]))

    def prism_xz(self, pts, y0, y1):
        """Profil v rovině XZ vytažený podél Y."""
        return self._prism(pts, y0, y1, lambda p, y: (p[0], y, p[1]))

    def prism_xy(self, pts, z0, z1):
        """Profil v rovině XY vytažený podél Z."""
        return self._prism(pts, z0, z1, lambda p, z: (p[0], p[1], z))

    def cyl(self, c, axis, r, length, seg=12):
        ring = [(r * math.cos(2 * math.pi * i / seg), r * math.sin(2 * math.pi * i / seg)) for i in range(seg)]
        h = length / 2
        if axis == "x":
            return self.prism_yz([(c[1] + u, c[2] + w) for u, w in ring], c[0] - h, c[0] + h)
        if axis == "y":
            return self.prism_xz([(c[0] + u, c[2] + w) for u, w in ring], c[1] - h, c[1] + h)
        return self.prism_xy([(c[0] + u, c[1] + w) for u, w in ring], c[2] - h, c[2] + h)

    def finish(self, name, kind, part, step, grp="", until="", frm=(0, 0, 0), label=""):
        bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces)
        me = bpy.data.meshes.new("H_" + name)
        self.bm.to_mesh(me)
        self.bm.free()
        xs = [v.co.x for v in me.vertices]
        ys = [v.co.y for v in me.vertices]
        zs = [v.co.z for v in me.vertices]
        c = ((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, (min(zs) + max(zs)) / 2)
        for v in me.vertices:
            v.co.x -= c[0]
            v.co.y -= c[1]
            v.co.z -= c[2]
        me.materials.append(MATS[kind])
        ob = bpy.data.objects.new(name, me)
        ob.location = c
        scene.collection.objects.link(ob)
        ob["part"] = part
        ob["step"] = step
        ob["grp"] = grp
        ob["until"] = until
        ob["kind"] = kind
        ob["label"] = label
        ob["fx"], ob["fy"], ob["fz"] = (float(f) for f in frm)
        return ob


def mx(a, b):
    """Zrcadlení intervalu v ose X (levá ↔ pravá strana domku)."""
    return 3270 - b, 3270 - a


# --------------------------------------------------------------------------- základní kóty
L, D = 3270, 2210                 # půdorys (str. 1, 16)
AX = [45, 1105, 2165, 3225]       # osy sloupků podél X, rozteč 1060 (str. 8)
AY = [45, 1105, 2165]             # osy sloupků podél Y (boční rám 1105 + 1105, str. 9)
PAD = 30                          # 3 gumové podložky 80x80x10 nad sebou (str. 9, detail J)
ZB = PAD + 45                     # horní hrana spodních hranolů 45x90 naležato
REAR_TOP = ZB + 1990              # sloupky č.1, 2 dl. 1990
FRONT_TOP = ZB + 2650             # sloupky č.3, 4 dl. 2650
FRONT_BEAM_TOP = FRONT_TOP - 660 + 90 + 515   # horní č.5: kóta 660 od konců sloupků k dolnímu č.5, mezi nimi ucpávka č.9 (515)
MOD_T = 20                        # tloušťka palubkového modulu
GROOVE_W, GROOVE_D = 20, 25       # drážka ve sloupku (modul 1020 = 1060 − 90 + 2×25)
BAYS = [(a + 20, b - 20) for a, b in zip(AX, AX[1:])]      # [65,1085], [1125,2145], [2185,3205]
SBAYS = [(a + 20, b - 20) for a, b in zip(AY, AY[1:])]     # [65,1085], [1125,2145]

# exploze rámů v krocích 1–4: rámy se skládají vedle plošiny na zemi, v kroku 5 se postaví na plošinu
EXPLODE = {"rear": (0, 1500, 0), "front": (0, -1500, 0), "sideL": (-1200, 0, 0), "sideR": (1200, 0, 0)}

# --------------------------------------------------------------------------- střecha (str. 12–14)
RAFTER_C = [-22.5 + 828.75 * i for i in range(5)]   # osy krokví (2 krajní jsou součástí štítů)
K = (FRONT_BEAM_TOP - 30 - 2050) / 2255               # sklon spodní hrany krokví
CA = 1 / math.sqrt(1 + K * K)
SA = K * CA
RH = 90 / CA                                          # svislá výška krokve 45x90


def zb(y):
    """Spodní hrana krokve – leží na zadní pozednici a na čelní horní pozednici (zapuštěná sedla)."""
    return 2050 + K * (2232.5 - y)


def zt(y):
    return zb(y) + RH


RAFTER_YF = -195
RAFTER_YR = RAFTER_YF + 2730 * CA      # krokev č.10 dl. 2730
REAR_SEAT_Y = 2232.5 - (REAR_TOP - 2050) / K


def rafter_profile():
    yf, yr = RAFTER_YF, RAFTER_YR
    return [
        (yf, zt(yf)), (yr, zt(yr)), (yr, zb(yr)),
        (2255, zb(2255)), (2255, REAR_TOP), (REAR_SEAT_Y, REAR_TOP),   # sedlo na zadní pozednici
        (0, zb(0)), (0, FRONT_BEAM_TOP), (-45, FRONT_BEAM_TOP), (-45, zb(-45)),  # sedlo na čelní pozednici
        (yf, zb(yf)),
    ]


ROOF_Y0 = 2440                 # zadní hrana palubek střechy
ROOF_ROWS, ROOF_W = 25, 110    # palubky 18x110, 25 řad (č.21 + č.22)


def rp(u, v):
    """Bod v rovině střechy: u = vzdálenost po spádu od zadní hrany, v = kolmo nahoru od horní hrany krokví."""
    return (ROOF_Y0 - u * CA + v * SA, zt(ROOF_Y0) + u * SA + v * CA)


def roof_rect(u0, u1, v0, v1):
    return [rp(u0, v0), rp(u1, v0), rp(u1, v1), rp(u0, v1)]


ROOF_U = ROOF_ROWS * ROOF_W     # 2750
ROOF_X0, ROOF_X1 = -195, 3465   # palubky 1000 + 2660 = 3660 (+ štítovky 2×18 = 3700, str. 16)


# =========================================================================== 0) plošina
FLOOR_T = 28                     # dřevěná podlaha na plošině (tloušťka odhadem – terasové prkno)
PLAT_H = 140                     # výška hranolů plošiny
GROUND = -FLOOR_T - PLAT_H - 160  # terén pod patkami


def platform():
    """Plošina dle fotky: obvodový rám, zdvojený příčný hranol uprostřed, podélné trámky,
    stavitelné patky a navrch dřevěná podlaha. Vnější rozměr = půdorys domku 3270 x 2210
    (domek na ní sedí líc na líc), takže všech 10 míst s gumovými podložkami (pod sloupky)
    leží nad nosnými hranoly rámu. Horní plocha podlahy je Z=0."""
    m = Mesh()
    z1 = -FLOOR_T
    z0, w = z1 - PLAT_H, 100
    m.box(0, L, 0, w, z0, z1).box(0, L, D - w, D, z0, z1)                # čelní a zadní hranol
    m.box(0, w, w, D - w, z0, z1).box(L - w, L, w, D - w, z0, z1)        # boční hranoly
    m.box(L / 2 - 60, L / 2 + 60, w, D - w, z0, z1)                       # zdvojený příčný hranol
    span = (D - 2 * w) / 6
    for k in range(1, 6):                                                  # podélné trámky
        yc = w + span * k
        m.box(w, L / 2 - 60, yc - 30, yc + 30, z0, z1).box(L / 2 + 60, L - w, yc - 30, yc + 30, z0, z1)
    m.finish("P00_plosina", "deck", 0, "s0", label="Dřevěná plošina (rám)")
    plates = Mesh()                                                        # spojovací plechy na čele
    for x0 in (0, L / 2 - 110, L - 220):
        plates.box(x0, x0 + 220, -2, 0, z0 + 15, z1 - 15)
    for y0 in (0, D - 220):
        plates.box(-2, 0, y0, y0 + 220, z0 + 15, z1 - 15).box(L, L + 2, y0, y0 + 220, z0 + 15, z1 - 15)
    plates.finish("P00_plechy", "steel", 0, "s0", label="Spojovací plechy plošiny")
    f = Mesh()
    for x in (50, L / 2, L - 50):
        for y in (50, D / 2, D - 50):
            f.box(x - 60, x + 60, y - 60, y + 60, GROUND, GROUND + 6)
            f.cyl((x, y, (GROUND + z0) / 2), "z", 16, z0 - GROUND - 12)
            f.box(x - 45, x + 45, y - 45, y + 45, z0 - 6, z0)
    f.finish("P00_patky", "steel", 0, "s0", label="Stavitelné patky plošiny")
    fl = Mesh()                                                            # podlaha – prkna napříč trámků
    n = math.ceil(L / 125)
    bw = (L - (n - 1) * 5) / n
    for k in range(n):
        x = k * (bw + 5)
        fl.box(x, x + bw, 0, D, -FLOOR_T, 0)
    fl.finish("P00_podlaha", "floor", 0, "s0", label="Dřevěná podlaha na plošině")


# =========================================================================== rámy
def post_poly(x0, y0, grooves):
    x1, y1 = x0 + 90, y0 + 90
    cx, cy = x0 + 45, y0 + 45
    g, d = GROOVE_W / 2, GROOVE_D
    p = [(x0, y0)]
    if "ym" in grooves:
        p += [(cx - g, y0), (cx - g, y0 + d), (cx + g, y0 + d), (cx + g, y0)]
    p += [(x1, y0)]
    if "xp" in grooves:
        p += [(x1, cy - g), (x1 - d, cy - g), (x1 - d, cy + g), (x1, cy + g)]
    p += [(x1, y1)]
    if "yp" in grooves:
        p += [(cx + g, y1), (cx + g, y1 - d), (cx - g, y1 - d), (cx - g, y1)]
    p += [(x0, y1)]
    if "xm" in grooves:
        p += [(x0, cy + g), (x0 + d, cy + g), (x0 + d, cy - g), (x0, cy - g)]
    return p


def post(name, part, step, grp, x0, y0, top, grooves, label):
    Mesh().prism_xy(post_poly(x0, y0, grooves), ZB, top).finish(
        name, "wood", part, step, grp, frm=(0, 0, 900), label=label)


def holes(name, step, grp, pts, axis, length):
    m = Mesh()
    for p in pts:
        m.cyl(p, axis, 5, length + 2, seg=10)
    m.finish(name, "hole", -1, step, grp, label="Předvrtaný otvor Ø5 pro vrut č.32")


def rear_frame():
    g = "rear"
    # 1a – hranoly č.5 (nahoře, z vnější strany) a č.7 (dole naležato, přesazení 20 mm)
    Mesh().box(-45, 3315, D, D + 45, REAR_TOP - 90, REAR_TOP).finish(
        "P05_pozednice_zadni", "wood", 5, "s1a", g, frm=(0, 0, 500), label="Hranol č.5 – pozednice hlavní")
    Mesh().box(20, 3250, D - 110, D - 20, PAD, ZB).finish(
        "P07_spodni_zadni", "wood", 7, "s1a", g, frm=(0, 0, 500), label="Hranol č.7 – spodní")
    top = [(x, D + 22.5, REAR_TOP - 45 + dz) for x in AX for dz in (-25, 25)]   # 20 mm od hran
    top += [(x, D + 22.5, REAR_TOP - 45) for x in (-22.5, 3292.5)]          # detail G – spoj s bokem
    holes("H_otvory_zadni_5", "s1a", g, top, "y", 45)
    bot = [(x, D - 65, PAD + 22.5) for x in AX]
    holes("H_otvory_zadni_7", "s1a", g, bot, "z", 45)
    # 1b – sloupky č.1 (rohy) a č.2 (střední)
    post("P01_noha1_zadni_L", 1, "s1b", g, 0, D - 90, REAR_TOP, {"xp", "ym"}, "Hranol č.1 – noha1 (1990)")
    post("P01_noha1_zadni_P", 1, "s1b", g, L - 90, D - 90, REAR_TOP, {"xm", "ym"}, "Hranol č.1 – noha1 (1990)")
    post("P02_noha2_zadni_1", 2, "s1b", g, 1060, D - 90, REAR_TOP, {"xm", "xp"}, "Hranol č.2 – noha2 (1990)")
    post("P02_noha2_zadni_2", 2, "s1b", g, 2120, D - 90, REAR_TOP, {"xm", "xp"}, "Hranol č.2 – noha2 (1990)")


def front_frame():
    g = "front"
    Mesh().box(-45, 3315, -45, 0, FRONT_BEAM_TOP - 90, FRONT_BEAM_TOP).finish(
        "P05_pozednice_celni_horni", "wood", 5, "s2a", g, frm=(0, 0, 500), label="Hranol č.5 – pozednice hlavní (horní)")
    Mesh().box(-45, 3315, -45, 0, FRONT_TOP - 750, FRONT_TOP - 660).finish(
        "P05_pozednice_celni_dolni", "wood", 5, "s2a", g, frm=(0, 0, 500), label="Hranol č.5 – pozednice hlavní (o 660 níž)")
    Mesh().box(20, 3250, 20, 110, PAD, ZB).finish(
        "P07_spodni_celni", "wood", 7, "s2a", g, frm=(0, 0, 500), label="Hranol č.7 – spodní")
    top = [(x, -22.5, z + dz) for x in AX for z in (FRONT_BEAM_TOP - 45, FRONT_TOP - 705) for dz in (-25, 25)]
    top += [(x, -22.5, FRONT_TOP - 705) for x in (-22.5, 3292.5)]           # detail H – spoj s bokem
    holes("H_otvory_celni_5", "s2a", g, top, "y", 45)
    holes("H_otvory_celni_7", "s2a", g, [(x, 65, PAD + 22.5) for x in AX], "z", 45)
    post("P03_noha1_celni_L", 3, "s2b", g, 0, 0, FRONT_TOP, {"xp", "yp"}, "Hranol č.3 – noha1 (2650)")
    post("P03_noha1_celni_P", 3, "s2b", g, L - 90, 0, FRONT_TOP, {"xm", "yp"}, "Hranol č.3 – noha1 (2650)")
    post("P04_noha2_celni_1", 4, "s2b", g, 1060, 0, FRONT_TOP, {"xm", "xp"}, "Hranol č.4 – noha2 (2650)")
    post("P04_noha2_celni_2", 4, "s2b", g, 2120, 0, FRONT_TOP, {"xm", "xp"}, "Hranol č.4 – noha2 (2650)")
    # ucpávky č.9 (45x70x515) z boku rohových sloupků mezi oběma hranoly č.5 (detail C)
    for side, (a, b) in (("L", (-45, 0)), ("P", mx(-45, 0))):
        Mesh().box(a, b, 0, 70, FRONT_BEAM_TOP - 90 - 515, FRONT_BEAM_TOP - 90).finish(
            f"P09_ucpavka_{side}", "wood", 9, "s2b", g, frm=(-400 if side == "L" else 400, 0, 0),
            label="Hranol č.9 – ucpávka (mezi hranoly č.5)")


def side_frames():
    for side in ("L", "P"):
        g = "sideL" if side == "L" else "sideR"
        sx = (lambda a, b: (a, b)) if side == "L" else mx
        Mesh().box(*sx(-45, 0), 0, D, REAR_TOP - 90, REAR_TOP).finish(
            f"P06_pozednice_bok_{side}", "wood", 6, "s3a", g, frm=(0, 0, 500), label="Hranol č.6 – pozednice čelní (2210)")
        Mesh().box(*sx(20, 110), 110, D - 110, PAD, ZB).finish(
            f"P08_spodni_bok_{side}", "wood", 8, "s3a", g, frm=(0, 0, 500), label="Hranol č.8 – spodní (1990)")
        hx = -22.5 if side == "L" else 3292.5
        holes(f"H_otvory_bok_6_{side}", "s3a", g, [(hx, yy, REAR_TOP - 45 + dz) for yy in AY for dz in (-25, 25)], "x", 45)
        hx = 65 if side == "L" else 3205
        holes(f"H_otvory_bok_8_{side}", "s3a", g, [(hx, 1105, PAD + 22.5)], "z", 45)
        x0 = 0 if side == "L" else L - 90
        post(f"P02_noha2_bok_{side}", 2, "s3b", g, x0, 1060, REAR_TOP, {"ym", "yp"}, "Hranol č.2 – noha2 (1990)")


def pads():
    spots = [(max(min(x, 3210), 60), D - 65, "rear") for x in AX]
    spots += [(max(min(x, 3210), 60), 65, "front") for x in AX]
    spots += [(65, 1105, "sideL"), (3205, 1105, "sideR")]
    for i, (x, y, g) in enumerate(spots):
        m = Mesh()
        for k in range(3):
            m.box(x - 40, x + 40, y - 40, y + 40, k * 10 + 0.5, k * 10 + 9.5)
        m.finish(f"P42_podlozky_{i + 1:02d}", "rubber", 42, "s4", g, frm=(0, 0, -350),
                 label="3× gumová podložka č.42 (80x80x10)")


# =========================================================================== moduly (str. 11)
def module_x(name, step, x0, z0, yc, frm=(0, 0, 1400)):
    m = Mesh()
    for k in range(3):
        m.box(x0, x0 + 1020, yc - MOD_T / 2, yc + MOD_T / 2, z0 + 110 * k + 1, z0 + 110 * (k + 1) - 1)
    m.finish(name, "wood", 23, step, frm=frm, label="Modul č.23 (330x1020)")


def module_y(name, step, xc, y0, z0):
    m = Mesh()
    for k in range(3):
        m.box(xc - MOD_T / 2, xc + MOD_T / 2, y0, y0 + 1020, z0 + 110 * k + 1, z0 + 110 * (k + 1) - 1)
    m.finish(name, "wood", 23, step, frm=(0, 0, 1400), label="Modul č.23 (330x1020)")


def walls():
    for b, (x0, _) in enumerate(BAYS):
        for i in range(6):
            module_x(f"P23_modul_zadni_{b + 1}_{i + 1}", "s6a", x0, ZB + 330 * i, D - 45)
    for side, xc in (("L", 45), ("P", L - 45)):
        for b, (y0, _) in enumerate(SBAYS):
            for i in range(6):
                module_y(f"P23_modul_bok_{side}_{b + 1}_{i + 1}", "s6b", xc, y0, ZB + 330 * i)
    for b in (0, 2):
        for i in range(6):
            module_x(f"P23_modul_celni_{b + 1}_{i + 1}", "s6c", BAYS[b][0], ZB + 330 * i, 45)
    # lišty č.12 (20x45x1870) zasunuté z boku do drážek dveřních sloupků
    Mesh().box(1125, 1170, 35, 55, ZB, ZB + 1870).finish(
        "P12_lista_dvere_L", "wood", 12, "s6c", frm=(350, 0, 0), label="Lišta č.12 (1870)")
    Mesh().box(2100, 2145, 35, 55, ZB, ZB + 1870).finish(
        "P12_lista_dvere_P", "wood", 12, "s6c", frm=(-350, 0, 0), label="Lišta č.12 (1870)")
    # lišta č.13 (18x120x1020) zasunutá shora nad dveřní otvor
    Mesh().box(1125, 2145, 36, 54, ZB + 1870, ZB + 1990).finish(
        "P13_lista_horni", "wood", 13, "s6c", frm=(0, 0, 900), label="Lišta horní č.13 (1020)")


WIN_Z0 = [REAR_TOP - 10, REAR_TOP, REAR_TOP - 10]   # okenní moduly v polích 1, 2, 3


def window_module(b, cut):
    x0 = BAYS[b][0]
    z0 = WIN_Z0[b]
    yc = 45
    y0, y1 = yc - MOD_T / 2, yc + MOD_T / 2
    ox0, ox1 = x0 + 210, x0 + 810                  # okenní otvor
    rc = RAFTER_C[b + 1]
    m = Mesh()
    for k in range(6):
        za, zb_ = z0 + 110 * k + 1, z0 + 110 * (k + 1) - 1
        if 1 <= k <= 3:
            m.box(x0, ox0 - 45, y0, y1, za, zb_).box(ox1 + 45, x0 + 1020, y0, y1, za, zb_)
        elif k == 5 and cut:
            # proříznutí pro krokev: šířka 45 + 2×5 mm vůle, do potřebné hloubky (str. 12)
            slot_b = 2618
            m.box(x0, rc - 27.5, y0, y1, za, zb_).box(rc + 27.5, x0 + 1020, y0, y1, za, zb_)
            m.box(rc - 27.5, rc + 27.5, y0, y1, za, slot_b)
        else:
            m.box(x0, x0 + 1020, y0, y1, za, zb_)
    # rámeček okna (svislé lišty a zasklívací lišty)
    m.box(ox0 - 45, ox0, y0 - 20, y1, z0 + 70, z0 + 480).box(ox1, ox1 + 45, y0 - 20, y1, z0 + 70, z0 + 480)
    m.box(ox0, ox1, y0 - 10, y1, z0 + 110, z0 + 130).box(ox0, ox1, y0 - 10, y1, z0 + 420, z0 + 440)
    if cut:
        m.finish(f"P24_okno_{b + 1}_proriznute", "wood", 24, "s7b", frm=(0, 0, 0),
                 label="Modul okno č.24 – proříznutý pro krokev")
    else:
        m.finish(f"P24_okno_{b + 1}", "wood", 24, "s6d", until="s7b", frm=(0, 0, 1200),
                 label="Modul okno č.24 (660x1020)")
        Mesh().box(ox0 + 2, ox1 - 2, yc - 1.5, yc + 1.5, z0 + 132, z0 + 418).finish(
            f"P24_okno_{b + 1}_vyplne", "glass", 24, "s6d", frm=(0, 0, 1200), label="Výplň okna (součást modulu č.24)")


def windows():
    for b in range(3):
        window_module(b, cut=False)
        window_module(b, cut=True)


# =========================================================================== krov (str. 12)
def gable(side):
    sx = (lambda a, b: (a, b)) if side == "L" else mx
    m = Mesh()
    m.prism_yz(rafter_profile(), *sx(-45, 0))                       # krokev štítu
    y = 70.0
    while y < REAR_SEAT_Y - 5:                                       # svislá prkna štítu
        y1 = min(y + 94, REAR_SEAT_Y)
        pts = [(y, REAR_TOP), (y1, REAR_TOP)]
        if zb(y1) - REAR_TOP > 1:
            pts.append((y1, zb(y1) - 1))
        pts.append((y, zb(y) - 1))
        m.prism_yz(pts, *sx(-45, -27))
        y = y1 + 2
    m.box(*sx(-27, -7), 75, 120, REAR_TOP + 5, zb(120) - 5)          # svislá lať u čela
    m.prism_yz([(150, REAR_TOP + 5), (1750, zb(1750) - 60), (1750, zb(1750) - 15), (150, REAR_TOP + 50)], *sx(-27, -7))
    part = 25 if side == "L" else 26
    m.finish(f"P{part}_stit_{'levy' if side == 'L' else 'pravy'}", "wood", part, "s7a",
             frm=(0, 0, 900), label=f"Štít č.{part} – {'levý' if side == 'L' else 'pravý'}")


def roof_frame():
    gable("L")
    gable("P")
    for i, rc in enumerate(RAFTER_C[1:4]):
        Mesh().prism_yz(rafter_profile(), rc - 22.5, rc + 22.5).finish(
            f"P10_krokev_{i + 1}", "wood", 10, "s7c", frm=(0, 0, 700), label="Hranol č.10 – krokev (2730)")
        top = WIN_Z0[i] + 660
        for j, (a, b) in enumerate(((rc - 72.5, rc - 27.5), (rc + 27.5, rc + 72.5))):
            Mesh().box(a, b, 55, 75, top - 200, top).finish(
                f"P11_svlak_{i + 1}_{j + 1}", "wood", 11, "s7b", frm=(0, 350, 0), label="Prkno č.11 – svlak (200)")


# =========================================================================== palubky střechy (str. 13)
def roof_boards():
    for i in range(ROOF_ROWS):
        prof = roof_rect(ROOF_W * i + 1, ROOF_W * (i + 1) - 1, 0, 18)
        if i % 2 == 0:
            parts = [(22, ROOF_X0, 804), (21, 806, ROOF_X1)]
        else:
            parts = [(21, ROOF_X0, 2464), (22, 2466, ROOF_X1)]
        for p, a, b in parts:
            Mesh().prism_yz(prof, a, b).finish(
                f"P{p}_palubka_r{i + 1:02d}_{'a' if a == ROOF_X0 else 'b'}", "wood", p, "s8a",
                frm=(0, 0, 450), label=f"Palubka střechy č.{p} ({2660 if p == 21 else 1000})")


# =========================================================================== dveře (str. 13)
def door():
    m = Mesh()
    for k in range(9):
        m.box(1140 + 110 * k + 1, 1140 + 110 * (k + 1) - 1, -18, 0, 50, 1965)
    m.box(1180, 2090, 0, 20, 250, 360).box(1180, 2090, 0, 20, 1600, 1710)
    m.prism_xz([(1990, 360), (2090, 360), (1280, 1600), (1180, 1600)], 0, 20)
    m.finish("P27_kridlo_vrat", "wood", 27, "s8b", frm=(0, -700, 0), label="Křídlo vrat č.27")
    for i, zc in enumerate((305, 1655)):
        h = Mesh()
        h.prism_xz([(2135, zc - 20), (2135, zc + 20), (1935, zc + 10), (1935, zc - 10)], -21, -18)
        h.box(2138, 2188, -3, 0, zc - 60, zc + 60)
        h.box(2133, 2140, -21, 0, zc - 60, zc - 50).box(2133, 2140, -21, 0, zc + 50, zc + 60)
        h.cyl((2136, -10, zc), "z", 6, 120)
        h.finish(f"P29_zaves_{i + 1}", "steel", 29, "s8b", frm=(0, -300, 0), label="Závěs ZTO 200 č.29")
    p = Mesh()
    p.box(1160, 1260, -24, -18, 985, 1025)
    p.cyl((1170, -30, 1005), "x", 7, 150)
    p.box(1085, 1125, -20, 0, 980, 1030)
    p.finish("P30_petlice", "steel", 30, "s8b", frm=(0, -300, 0), label="Petlice WOGO 120 č.30")


# =========================================================================== lišty a štítovky (str. 14)
def trims():
    fy = rp(ROOF_U, 0)[0]
    ztop = rp(ROOF_U, 36)[1]
    for side in ("L", "P"):
        sx = (lambda a, b: (a, b)) if side == "L" else mx
        dx = -400 if side == "L" else 400
        Mesh().prism_yz(roof_rect(0, ROOF_U + 18, -58, 36), *sx(-213, -195)).finish(
            f"P17_stitovka_{side}", "wood", 17, "s9", frm=(dx, 0, 0), label="Prkno č.17 – štítovka (2770)")
        Mesh().prism_yz(roof_rect(0, ROOF_U + 18, 18, 36), *sx(-195, -150)).finish(
            f"P15_lista_strechy_{side}", "wood", 15, "s9", frm=(0, 0, 350), label="Prkno č.15 – lišta střechy (2770)")
    for i, (a, b) in enumerate(((-213, 1635), (1635, 3483))):
        Mesh().box(a, b, fy - 18, fy, ztop - 94, ztop).finish(
            f"P18_stitovka_celni_{i + 1}", "wood", 18, "s9", frm=(0, -400, 0), label="Prkno č.18 – štítovka čelní (1850)")
    for i, (a, b) in enumerate(((-150, 1635), (1635, 3420))):
        Mesh().prism_yz(roof_rect(ROOF_U - 27, ROOF_U + 18, 18, 36), a, b).finish(
            f"P16_lista_strechy_celni_{i + 1}", "wood", 16, "s9", frm=(0, 0, 350),
            label="Prkno č.16 – lišta střechy čelní (1785)")
    zc = ztop - 47
    logo = Mesh()
    logo.prism_xz([(1555, zc - 40), (1585, zc - 60), (1685, zc - 60), (1715, zc - 40),
                   (1715, zc + 40), (1685, zc + 60), (1585, zc + 60), (1555, zc + 40)], fy - 30, fy - 18)
    logo.finish("P28_desticka_logo", "logo", 28, "s9", frm=(0, -300, 0), label="Destička s logem č.28")


# =========================================================================== krycí lišty (str. 15)
def cover_strips():
    for j in range(4):
        a, b = RAFTER_C[j] + 22.5, RAFTER_C[j + 1] - 22.5
        u = (ROOF_Y0 + 54) / CA
        Mesh().prism_yz(roof_rect(u - 9, u + 9, -120, 0), a, b).finish(
            f"P19_lista_kryci_celni_{j + 1}", "wood", 19, "s10", frm=(0, -400, 0), label="Prkno č.19 – lišta krycí (18x120x780)")
        u = (ROOF_Y0 - 2292) / CA
        Mesh().prism_yz(roof_rect(u - 9, u + 9, -94, 0), a, b).finish(
            f"P20_lista_kryci_zadni_{j + 1}", "wood", 20, "s10", frm=(0, 400, 0), label="Prkno č.20 – lišta krycí (18x94x780)")
    for side in ("L", "P"):
        sx = (lambda a, b: (a, b)) if side == "L" else mx
        pts = [(-45, zb(-45) + 20), (2255, zb(2255) + 20), (2255, zb(2255) - 25), (-45, zb(-45) - 25)]
        Mesh().prism_yz(pts, *sx(-63, -45)).finish(
            f"P14_lista_stitu_{side}", "wood", 14, "s10", frm=(-400 if side == "L" else 400, 0, 0),
            label="Prkno č.14 – lišta štítu (2400)")


# =========================================================================== stavba + export
platform()
rear_frame()
front_frame()
side_frames()
pads()
walls()
windows()
roof_frame()
roof_boards()
door()
trims()
cover_strips()

for ob in scene.objects:
    g = ob.get("grp", "")
    if g in EXPLODE:
        ex, ey, _ = EXPLODE[g]
        ob["ex"], ob["ey"], ob["ez"] = float(ex), float(ey), float(GROUND)

os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=OUT_GLB, export_format="GLB", use_active_scene=True,
    export_extras=True, export_yup=True, export_apply=False,
)

counts = {}
for ob in scene.objects:
    counts[ob["part"]] = counts.get(ob["part"], 0) + 1
result = {"objects": len(scene.objects), "per_part": dict(sorted(counts.items())), "glb": OUT_GLB,
          "glb_kb": round(os.path.getsize(OUT_GLB) / 1024)}
