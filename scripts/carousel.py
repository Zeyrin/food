import sys, json
from PIL import Image, ImageDraw, ImageFont, ImageFilter
F = "/usr/share/fonts/truetype/google-fonts/Poppins-"
AF = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
def f(s, w="Bold"): return ImageFont.truetype(F + w + ".ttf", s)
W, H, M = 1080, 1350, 90
DK, YE, OR, CR, WH, GR = "#141414", "#C7FF4A", "#FF5A36", "#FFF8EF", "#FFFFFF", "#8C857C"
ICON = Image.open("public/icon-512.png").convert("RGB").resize((52, 52), Image.LANCZOS)
IM = Image.new("L", (52, 52), 0); ImageDraw.Draw(IM).rounded_rectangle((0, 0, 51, 51), 13, fill=255)
c = json.load(open(sys.argv[1])); out = sys.argv[2]
photo = Image.open(c["photo"]).convert("RGB")

def fit(d, t, size, maxw, w="Bold"):
    while d.textlength(t, font=f(size, w)) > maxw: size -= 2
    return f(size, w)
def cover(im, w, h):
    s = max(w / im.width, h / im.height); r = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x, y = (r.width - w) // 2, (r.height - h) // 2
    return r.crop((x, y, x + w, y + h))
def spaced(d, xy, t, font, fill, tr=6):
    x, y = xy
    for ch in t: d.text((x, y), ch, font=font, fill=fill); x += d.textlength(ch, font=font) + tr
def arrow(d, xy, t, font, col, anchor="l"):
    a, b = t.split("→"); af = ImageFont.truetype(AF, font.size)
    wa, wr, wb = d.textlength(a, font=font), d.textlength("→", font=af), d.textlength(b, font=font)
    x = xy[0] - ((wa + wr + wb) / 2 if anchor == "m" else (wa + wr + wb) if anchor == "r" else 0)
    for s, fo in ((a, font), ("→", af), (b, font)):
        d.text((x, xy[1]), s, font=fo, fill=col, anchor="lm"); x += d.textlength(s, font=fo)
def head(d, col, n, im):
    im.paste(ICON, (M, 52), IM); d.text((M + 68, 78), "fffood", font=f(30), fill=col, anchor="lm")
    d.text((W - M, 78), f"{n}/3", font=f(26, "Regular"), fill=col, anchor="rm")
def grad(h, a0, a1, p=1.6):
    g = Image.new("L", (1, h))
    for k in range(h): g.putpixel((0, k), int(a0 + (a1 - a0) * (k / (h - 1)) ** p))
    return g.resize((W, h))

# Slide 1 — photo + accroche
im = Image.new("RGB", (W, H), DK)
ph = cover(photo, W, 760); im.paste(ph, (0, 0))
im.paste(Image.new("RGB", (W, 760), DK), (0, 0), grad(760, 0, 255, 2.4))
im.paste(Image.new("RGB", (W, 200), DK), (0, 0), grad(200, 140, 0, 1))
d = ImageDraw.Draw(im); head(d, WH, 1, im)
y = 690; spaced(d, (M, y), c["eyebrow"].upper(), f(24, "Medium"), OR); y += 56
for l in c["s1_lines"]:
    d.text((M, y), l, font=fit(d, l, 66, W - 2 * M), fill=WH); y += 80
kf = fit(d, c["kw"], 124, W - 2 * M); d.text((M - 4, y - 6), c["kw"], font=kf, fill=YE); y += 150
d.text((M, y), c["s1_sub"], font=fit(d, c["s1_sub"], 34, W - 2 * M, "Light"), fill=GR)
d.line((M, 1250, W - M, 1250), fill="#3A3330", width=2)
arrow(d, (W - M, 1290), "La raison  →", f(30, "Medium"), WH, "r")
im.save(out + "-1.png")

# Slide 2 — le secret
im = Image.new("RGB", (W, H), CR); d = ImageDraw.Draw(im); head(d, DK, 2, im)
spaced(d, (M, 190), "LE SECRET", f(24, "Medium"), OR)
kf = fit(d, c["kw2"], 132, W - 2 * M); kw = d.textlength(c["kw2"], font=kf)
d.rectangle((M - 6, 330, M + kw + 6, 362), fill=YE); d.text((M - 6, 230), c["kw2"], font=kf, fill=DK)
y = 440
for i, (a, b) in enumerate(c["points"], 1):
    d.line((M, y, W - M, y), fill="#E8DFD2", width=2)
    d.text((M, y + 34), f"0{i}", font=f(40, "Light"), fill=OR)
    d.text((M + 110, y + 26), a, font=fit(d, a, 46, W - 2 * M - 110), fill=DK)
    d.text((M + 110, y + 92), b, font=fit(d, b, 32, W - 2 * M - 110, "Regular"), fill=GR)
    y += 170
d.line((M, y, W - M, y), fill="#E8DFD2", width=2)
d.rounded_rectangle((M, 1080, W - M, 1240), 24, fill=DK)
spaced(d, (M + 50, 1112), "RÉSULTAT", f(20, "Medium"), GR, 5)
d.text((M + 50, 1150), c["result"], font=fit(d, c["result"], 44, W - 2 * M - 100), fill=YE)
im.save(out + "-2.png")

# Slide 3 — la recette + ce que fait l'app
im = Image.new("RGB", (W, H), CR); d = ImageDraw.Draw(im); head(d, DK, 3, im)
pc = cover(photo, 230, 230); mk = Image.new("L", pc.size, 0)
ImageDraw.Draw(mk).rounded_rectangle((0, 0, *pc.size), 24, fill=255); im.paste(pc, (M, 160), mk)
tx = M + 270; spaced(d, (tx, 178), "À TESTER CE SOIR", f(22, "Medium"), OR)
tl = c["titre"]; tf = fit(d, tl, 52, W - M - tx)
words = tl.split(" "); x = tx
for j, wd in enumerate(words):
    d.text((x, 220), wd, font=tf, fill=OR if j == 1 else DK); x += d.textlength(wd + " ", font=tf)
d.text((tx, 300), c["meta"], font=f(28, "Regular"), fill=GR)
d.text((tx, 345), "Déjà dans fffood.", font=f(28, "Medium"), fill=DK)
d.line((M, 440, W - M, 440), fill="#E8DFD2", width=2)
spaced(d, (M, 480), "FFFOOD, EN 4 GESTES", f(24, "Medium"), OR)
steps = [("Choisis tes repas", "de la semaine, parmi +130 recettes"),
         ("La liste se fait seule", "ingrédients additionnés, tu coches"),
         ("Partage-la en un lien", "le foyer voit la même liste, en direct"),
         ("Cuisine pas à pas", "étapes claires et minuteurs intégrés")]
y = 540
for i, (a, b) in enumerate(steps, 1):
    d.ellipse((M, y, M + 64, y + 64), fill=DK)
    d.text((M + 32, y + 33), str(i), font=f(30), fill=YE, anchor="mm")
    d.text((M + 96, y - 4), a, font=f(40), fill=DK)
    d.text((M + 96, y + 50), b, font=f(28, "Regular"), fill=GR)
    y += 140
x = M
for t in ("Gratuit", "Sans compte", "Marche hors ligne"):
    tw = d.textlength(t, font=f(26, "Medium"))
    d.rounded_rectangle((x, 1110, x + tw + 44, 1162), 26, outline=DK, width=2)
    d.text((x + 22, 1136), t, font=f(26, "Medium"), fill=DK, anchor="lm"); x += tw + 60
d.rectangle((0, 1230, W, H), fill=OR)
arrow(d, (W // 2, 1290), "Essaie gratuitement  →  fffood.fr", f(40), WH, "m")
im.save(out + "-3.png")

ims = [Image.open(out + f"-{i}.png").resize((360, 450)) for i in (1, 2, 3)]
m = Image.new("RGB", (1100, 450), "white")
for i, x in enumerate(ims): m.paste(x, (i * 370, 0))
m.save(sys.argv[3])
