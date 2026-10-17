import sys, json
from PIL import Image, ImageDraw, ImageFont
F = "/usr/share/fonts/truetype/google-fonts/Poppins-"
def f(s, w="Bold"): return ImageFont.truetype(F + w + ".ttf", s)
W, H = 1080, 1350
DK, YE, OR, CR, WH, GR = "#1C1816", "#FFCD3C", "#EB5E28", "#FAF0E2", "#FFFFFF", "#9A918A"
c = json.load(open(sys.argv[1])); out = sys.argv[2]

def fit(d, t, size, maxw, w="Bold"):
    while d.textlength(t, font=f(size, w)) > maxw: size -= 2
    return f(size, w)
AF = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
def arrow_text(d, xy, t, font, col):
    a, b = t.split("→"); af = ImageFont.truetype(AF, font.size)
    wa, wr, wb = d.textlength(a, font=font), d.textlength("→", font=af), d.textlength(b, font=font)
    x = xy[0] - (wa + wr + wb) / 2
    d.text((x, xy[1]), a, font=font, fill=col, anchor="lm"); x += wa
    d.text((x, xy[1]), "→", font=af, fill=col, anchor="lm"); x += wr
    d.text((x, xy[1]), b, font=font, fill=col, anchor="lm")
def logo(d, col): d.text((70, 56), "fffood", font=f(34), fill=col)

# Slide 1
im = Image.new("RGB", (W, H), DK); d = ImageDraw.Draw(im); logo(d, YE)
y = 230
for l in c["s1_lines"]:
    d.text((70, y), l, font=fit(d, l, 95, 940), fill=WH); y += 118
y += 30; kf = fit(d, c["kw"], 170, 860)
bb = d.textbbox((0, 0), c["kw"], font=kf)
d.rectangle((50, y, 50 + bb[2] + 60, y + bb[3] + 50), fill=YE)
d.text((80, y + 15), c["kw"], font=kf, fill=DK); y += bb[3] + 110
d.text((70, y), c["s1_sub"], font=fit(d, c["s1_sub"], 44, 940, "Medium"), fill=GR)
d.rounded_rectangle((70, 1130, 480, 1230), 50, fill=OR)
arrow_text(d, (275, 1180), "La raison →", f(44), WH)
im.save(out + "-1.png")

# Slide 2
im = Image.new("RGB", (W, H), OR); d = ImageDraw.Draw(im); logo(d, DK)
d.text((70, 150), "Le secret :", font=f(64), fill=DK)
kf = fit(d, c["kw2"], 130, 880); bb = d.textbbox((0, 0), c["kw2"], font=kf)
d.rounded_rectangle((60, 250, 60 + bb[2] + 60, 250 + bb[3] + 40), 24, fill=WH)
d.text((90, 260), c["kw2"], font=kf, fill=DK)
y = 250 + bb[3] + 90
for i, (a, b) in enumerate(c["points"], 1):
    d.ellipse((70, y, 160, y + 90), fill=DK)
    d.text((115, y + 47), str(i), font=f(54), fill=YE, anchor="mm")
    d.text((190, y - 2), a, font=fit(d, a, 54, 820), fill=WH)
    d.text((190, y + 62), b, font=fit(d, b, 38, 820, "Regular"), fill=DK)
    y += 175
d.rounded_rectangle((60, 1100, 1020, 1260), 28, fill=DK)
d.text((540, 1180), c["result"], font=fit(d, c["result"], 52, 880), fill=YE, anchor="mm")
im.save(out + "-2.png")

# Slide 3
im = Image.new("RGB", (W, H), CR); d = ImageDraw.Draw(im); logo(d, OR)
d.text((70, 140), "À tester ce soir", font=f(40, "Medium"), fill=GR)
y = 200
for j, l in enumerate(c["title_lines"]):
    d.text((70, y), l, font=fit(d, l, 84, 940), fill=OR if j == 1 else DK); y += 100
d.text((70, y + 10), c["meta"], font=f(38, "Medium"), fill=DK)
px, py, pw, ph = 560, 560, 440, 620
d.rounded_rectangle((px, py, px + pw, py + ph), 50, fill=DK)
d.rounded_rectangle((px + 18, py + 18, px + pw - 18, py + ph - 18), 36, fill=WH)
d.rounded_rectangle((px + pw/2 - 50, py + 30, px + pw/2 + 50, py + 44), 7, fill=DK)
d.text((px + 50, py + 70), "Ma liste", font=f(46), fill=DK)
yy = py + 160
for k, ing in enumerate(c["ings"]):
    on = k < 2
    d.rounded_rectangle((px + 50, yy, px + 92, yy + 42), 10, fill=OR if on else WH, outline=OR, width=4)
    if on: d.line((px + 60, yy + 22, px + 70, yy + 32, px + 84, yy + 12), fill=WH, width=6)
    d.text((px + 110, yy - 2), ing, font=fit(d, ing, 32, pw - 150, "Medium"), fill=GR if on else DK)
    if on:
        tw = d.textlength(ing, font=fit(d, ing, 32, pw - 150, "Medium"))
        d.line((px + 110, yy + 22, px + 110 + tw, yy + 22), fill=GR, width=3)
    yy += 70
for k, l in enumerate(["Coche tes", "courses, on", "s'occupe de", "la liste."]):
    d.text((70, 600 + k * 66), l, font=f(52), fill=DK)
d.text((70, 900), "Partagée en 2 min.", font=f(38, "Medium"), fill=OR)
d.rectangle((0, 1220, W, H), fill=OR)
arrow_text(d, (540, 1285), "Ta liste de courses auto → fffood.fr", f(46), WH)
im.save(out + "-3.png")

ims = [Image.open(out + f"-{i}.png").resize((360, 450)) for i in (1, 2, 3)]
m = Image.new("RGB", (1100, 450), "white")
for i, x in enumerate(ims): m.paste(x, (i * 370, 0))
m.save(sys.argv[3])
