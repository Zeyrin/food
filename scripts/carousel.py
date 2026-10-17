import sys, json
from PIL import Image, ImageDraw, ImageFont, ImageFilter
F = "/usr/share/fonts/truetype/google-fonts/Poppins-"
AF = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
def f(s, w="Bold"): return ImageFont.truetype(F + w + ".ttf", s)
W, H, M = 1080, 1350, 90
DK, YE, OR, CR, WH, GR = "#1C1816", "#FFCD3C", "#EB5E28", "#FAF0E2", "#FFFFFF", "#8C837C"
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
def head(d, col, n):
    d.text((M, 64), "fffood", font=f(30), fill=col)
    d.text((W - M, 64), f"{n}/3", font=f(26, "Regular"), fill=col, anchor="ra")
def grad(h, a0, a1, p=1.6):
    g = Image.new("L", (1, h))
    for k in range(h): g.putpixel((0, k), int(a0 + (a1 - a0) * (k / (h - 1)) ** p))
    return g.resize((W, h))

# Slide 1 — photo + accroche
im = Image.new("RGB", (W, H), DK)
ph = cover(photo, W, 760); im.paste(ph, (0, 0))
im.paste(Image.new("RGB", (W, 760), DK), (0, 0), grad(760, 0, 255, 2.4))
im.paste(Image.new("RGB", (W, 200), DK), (0, 0), grad(200, 140, 0, 1))
d = ImageDraw.Draw(im); head(d, WH, 1)
y = 690; spaced(d, (M, y), c["eyebrow"].upper(), f(24, "Medium"), OR); y += 56
for l in c["s1_lines"]:
    d.text((M, y), l, font=fit(d, l, 66, W - 2 * M), fill=WH); y += 80
kf = fit(d, c["kw"], 124, W - 2 * M); d.text((M - 4, y - 6), c["kw"], font=kf, fill=YE); y += 150
d.text((M, y), c["s1_sub"], font=fit(d, c["s1_sub"], 34, W - 2 * M, "Light"), fill=GR)
d.line((M, 1250, W - M, 1250), fill="#3A3330", width=2)
arrow(d, (W - M, 1290), "La raison  →", f(30, "Medium"), WH, "r")
im.save(out + "-1.png")

# Slide 2 — le secret
im = Image.new("RGB", (W, H), OR); d = ImageDraw.Draw(im); head(d, DK, 2)
spaced(d, (M, 190), "LE SECRET", f(24, "Medium"), DK)
d.text((M - 6, 230), c["kw2"], font=fit(d, c["kw2"], 132, W - 2 * M), fill=WH)
y = 440
for i, (a, b) in enumerate(c["points"], 1):
    d.line((M, y, W - M, y), fill="#C24A1C", width=2)
    d.text((M, y + 34), f"0{i}", font=f(40, "Light"), fill=DK)
    d.text((M + 110, y + 26), a, font=fit(d, a, 46, W - 2 * M - 110), fill=WH)
    d.text((M + 110, y + 92), b, font=fit(d, b, 32, W - 2 * M - 110, "Regular"), fill=DK)
    y += 170
d.line((M, y, W - M, y), fill="#C24A1C", width=2)
d.rounded_rectangle((M, 1080, W - M, 1240), 24, fill=DK)
spaced(d, (M + 50, 1112), "RÉSULTAT", f(20, "Medium"), GR, 5)
d.text((M + 50, 1150), c["result"], font=fit(d, c["result"], 44, W - 2 * M - 100), fill=YE)
im.save(out + "-2.png")

# Slide 3 — recette + liste
im = Image.new("RGB", (W, H), CR)
pc = cover(photo, W - 2 * M, 470); mk = Image.new("L", pc.size, 0)
ImageDraw.Draw(mk).rounded_rectangle((0, 0, *pc.size), 28, fill=255); im.paste(pc, (M, 140), mk)
d = ImageDraw.Draw(im); head(d, OR, 3)
spaced(d, (M, 650), "À TESTER CE SOIR", f(24, "Medium"), OR)
words = c["titre"].split(" "); tf = fit(d, c["titre"], 64, W - 2 * M); x = M
for j, wd in enumerate(words):
    d.text((x, 690), wd, font=tf, fill=OR if j == 1 else DK); x += d.textlength(wd + " ", font=tf)
d.text((M, 784), c["meta"], font=f(30, "Regular"), fill=GR)
cy, cw, chh = 860, W - 2 * M, 320
sh = Image.new("L", (W, H), 0); ImageDraw.Draw(sh).rounded_rectangle((M, cy + 12, M + cw, cy + chh + 12), 28, fill=60)
im.paste(Image.new("RGB", (W, H), "#C9B9A6"), (0, 0), sh.filter(ImageFilter.GaussianBlur(18)))
d = ImageDraw.Draw(im); d.rounded_rectangle((M, cy, M + cw, cy + chh), 28, fill=WH)
d.text((M + 44, cy + 34), "Ma liste", font=f(36), fill=DK)
d.text((M + cw - 44, cy + 44), "partagée en 2 min", font=f(24, "Regular"), fill=GR, anchor="ra")
for k, ing in enumerate(c["ings"][:6]):
    on = k < 2; cx = M + 44 + (k % 2) * (cw // 2); yy = cy + 120 + (k // 2) * 62
    d.rounded_rectangle((cx, yy, cx + 34, yy + 34), 8, fill=OR if on else WH, outline=OR, width=3)
    if on: d.line((cx + 8, yy + 18, cx + 15, yy + 25, cx + 27, yy + 10), fill=WH, width=4)
    fo = fit(d, ing, 28, cw // 2 - 110, "Regular"); d.text((cx + 52, yy + 17), ing, font=fo, fill=GR if on else DK, anchor="lm")
    if on: d.line((cx + 52, yy + 18, cx + 52 + d.textlength(ing, font=fo), yy + 18), fill=GR, width=2)
d.rectangle((0, 1240, W, H), fill=OR)
arrow(d, (W // 2, 1295), "Ta liste de courses auto  →  fffood.fr", f(38), WH, "m")
im.save(out + "-3.png")

ims = [Image.open(out + f"-{i}.png").resize((360, 450)) for i in (1, 2, 3)]
m = Image.new("RGB", (1100, 450), "white")
for i, x in enumerate(ims): m.paste(x, (i * 370, 0))
m.save(sys.argv[3])
