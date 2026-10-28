# Generuje obrazki do zadań (fikcyjne ilustracje) – lab/
import sys, os, math, random, hashlib
from PIL import Image, ImageDraw, ImageFont, ImageFilter
OUT = os.path.join(os.path.dirname(__file__), '..', 'lab')
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def seed(name): return int(hashlib.md5(name.encode()).hexdigest()[:8], 16)
def font(sz):
    try: return ImageFont.truetype(FONT, sz)
    except Exception: return ImageFont.load_default()
def landscape(name, label, w=480, h=320, hue=None):
    r = random.Random(seed(name))
    hue = r.random() if hue is None else hue
    import colorsys
    def hsl(hh, s, l): c = colorsys.hls_to_rgb(hh % 1, l, s); return tuple(int(x * 255) for x in c)
    im = Image.new('RGB', (w, h)); d = ImageDraw.Draw(im)
    top, bot = hsl(hue, .55, .55), hsl(hue + .08, .6, .85)
    for y in range(h):
        t = y / h; d.line([(0, y), (w, y)], fill=tuple(int(top[i] * (1 - t) + bot[i] * t) for i in range(3)))
    d.ellipse([w * .72, h * .12, w * .72 + h * .18, h * .30], fill=hsl(.12, .9, .8))
    for layer in range(3):
        pts = [(0, h)]; x = 0; base = h * (.45 + layer * .13)
        while x <= w:
            pts.append((x, base - r.random() * h * (.25 - layer * .05))); x += r.randint(30, 80)
        pts += [(w, h)]
        d.polygon(pts, fill=hsl(hue + .35 + layer * .03, .35, .38 - layer * .1))
    f = font(max(16, w // 22)); tw = d.textlength(label, font=f)
    d.rectangle([12, h - 18 - f.size - 8, 12 + tw + 16, h - 12], fill=(0, 0, 0))
    d.text((20, h - 16 - f.size - 6), label, fill=(255, 255, 255), font=f)
    return im
def product(name, label, w=400, h=300):
    r = random.Random(seed(name)); import colorsys
    c = colorsys.hls_to_rgb(r.random(), .55, .6); col = tuple(int(x * 255) for x in c)
    im = Image.new('RGB', (w, h), (245, 242, 236)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([w * .2, h * .12, w * .8, h * .72], 18, fill=col)
    for i in range(5):
        x = w * .25 + r.random() * w * .45; y = h * .18 + r.random() * h * .45; s = 10 + r.random() * 26
        d.ellipse([x, y, x + s, y + s], fill=(255, 255, 255))
    f = font(22); tw = d.textlength(label, font=f); d.text(((w - tw) / 2, h * .8), label, fill=(40, 40, 40), font=f)
    return im
def symbol(name, kind, w=120, h=120):
    im = Image.new('RGBA', (w, h), (255, 255, 255, 255)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w - 1, h - 1], outline=(180, 180, 180), width=2)
    if kind == 'o': d.ellipse([20, 20, w - 20, h - 20], outline=(30, 90, 200), width=12)
    if kind == 'x': d.line([25, 25, w - 25, h - 25], fill=(200, 40, 40), width=14); d.line([w - 25, 25, 25, h - 25], fill=(200, 40, 40), width=14)
    return im
def icon(name, kind, w=96, h=96):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    if kind == 'sun': d.ellipse([18, 18, 78, 78], fill=(255, 190, 40))
    if kind == 'snow':
        for a in range(0, 180, 30):
            x = math.cos(math.radians(a)) * 38; y = math.sin(math.radians(a)) * 38; d.line([48 - x, 48 - y, 48 + x, 48 + y], fill=(60, 140, 230), width=6)
    if kind == 'mix': d.ellipse([10, 10, 60, 60], fill=(255, 190, 40)); d.ellipse([36, 36, 86, 86], fill=(60, 140, 230))
    if kind == 'cloud': d.ellipse([10, 34, 50, 74], fill=(150, 160, 175)); d.ellipse([30, 20, 76, 66], fill=(150, 160, 175)); d.rectangle([28, 50, 80, 74], fill=(150, 160, 175))
    if kind == 'rain': d.ellipse([10, 20, 50, 56], fill=(120, 130, 150)); d.ellipse([30, 10, 76, 52], fill=(120, 130, 150)); [d.line([30 + i * 14, 62, 24 + i * 14, 84], fill=(60, 120, 220), width=5) for i in range(4)]
    if kind == 'paw': d.ellipse([28, 44, 68, 84], fill=(120, 80, 50)); [d.ellipse([12 + i * 20, 14 + (i % 3 == 1) * -6, 30 + i * 20, 36 + (i % 3 == 1) * -6], fill=(120, 80, 50)) for i in range(4)]
    if kind == 'bike': d.ellipse([6, 46, 42, 82], outline=(40, 40, 40), width=6); d.ellipse([54, 46, 90, 82], outline=(40, 40, 40), width=6); d.line([24, 64, 44, 34, 72, 64, 24, 64], fill=(200, 60, 40), width=5)
    return im
def save(im, name):
    p = os.path.join(OUT, name); ext = name.rsplit('.', 1)[-1].lower()
    if ext in ('jpg', 'jpeg'): im.convert('RGB').save(p, 'JPEG', quality=78, optimize=True)
    elif ext == 'png': im.save(p, 'PNG', optimize=True)
    elif ext == 'gif': im.convert('P').save(p, 'GIF')
    elif ext == 'bmp': im.convert('RGB').save(p, 'BMP')
    return p
if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    spec = [l.strip() for l in open(sys.argv[1], encoding='utf-8') if l.strip() and not l.startswith('#')]
    for line in spec:
        name, kind, label = (line.split('|') + ['', ''])[:3]
        if kind == 'land': im = landscape(name, label or name.split('.')[0])
        elif kind == 'prod': im = product(name, label or name.split('.')[0])
        elif kind in ('o', 'x', 'nic'): im = symbol(name, kind)
        elif kind.startswith('icon:'): im = icon(name, kind[5:])
        elif kind == 'wide': im = landscape(name, label, 900, 300)
        else: im = landscape(name, label or name)
        save(im, name)
    print('ok', len(spec))
