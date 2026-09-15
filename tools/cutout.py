"""白背景の製品レンダリングを、製品だけの透過PNGに変換する。

元画像には白背景用のドロップシャドウが焼き込まれている。そのまま切り抜くと
暗い背景では製品の下に灰色の溜まりとして残ってしまう。

製品の底面と接地影は階調的に融合していて明度では分離できないため、
「輪郭の幅は中央から下へ単調に狭くなる」という製品形状の性質を使い、
幅が再び広がり始める行（＝影の裾が始まる位置）から下を落とす。
切断面は最下部を数%フェードさせて消す。底面は十分暗いため黒地では目立たない。

影は book.css 側で背景に合わせて作り直す。

  使い方:  python3 tools/cutout.py assets/img/src/product-a.png assets/img/product-a.png
"""
import sys
from PIL import Image, ImageFilter

OUTLINE_MAX = 200   # 製品の輪郭を拾う明度。鏡面リムの外周までここに収まる
FLARE_SLACK = 4     # この画素数を超えて幅が広がったら影の裾とみなす
FADE_RATIO = 0.035  # 切断面を消すための下端フェード（シルエット高さに対する比率）
FEATHER = 1.1       # 輪郭のぼかし半径（px）
MAX_WIDTH = 1400    # web用の長辺


def row_extents(rgb, w, h):
    px = rgb.load()
    out = []
    for y in range(h):
        left = right = -1
        for x in range(w):
            r, g, b = px[x, y]
            v = r if r < g else g
            if b < v:
                v = b
            if v <= OUTLINE_MAX:
                if left < 0:
                    left = x
                right = x
        out.append(None if left < 0 else (left, right))
    return out


def drop_shadow_flare(extents):
    """最も広い行から下へたどり、幅が広がりに転じた行以降を捨てる。"""
    widths = [(e[1] - e[0] + 1) if e else -1 for e in extents]
    widest = widths.index(max(widths))

    cut = len(extents)
    for y in range(widest + 1, len(extents)):
        if widths[y] < 0:
            cut = y
            break
        if widths[y] > widths[y - 1] + FLARE_SLACK:
            cut = y
            break
    for y in range(cut, len(extents)):
        extents[y] = None
    return extents


def build_mask(extents, w, h):
    """行ごとの左端〜右端を塗る。製品は凸形状なので、内部の鏡面ハイライト
    （白に近く閾値から漏れる部分）もこれで過不足なく埋まる。"""
    mask = bytearray(w * h)
    for y, e in enumerate(extents):
        if not e:
            continue
        base = y * w
        for x in range(e[0], e[1] + 1):
            mask[base + x] = 255
    return mask


def fade_bottom(mask, extents, w):
    rows = [y for y, e in enumerate(extents) if e]
    if not rows:
        return mask
    top, bottom = rows[0], rows[-1]
    span = max(int((bottom - top) * FADE_RATIO), 1)
    for i in range(span):
        y = bottom - i
        a = int(255 * (i + 1) / (span + 1))  # 下端ほど薄く
        base = y * w
        for x in range(w):
            if mask[base + x]:
                mask[base + x] = a
    return mask


def main(src, dst):
    im = Image.open(src).convert("RGB")
    w, h = im.size

    extents = drop_shadow_flare(row_extents(im, w, h))
    mask = build_mask(extents, w, h)
    mask = fade_bottom(mask, extents, w)

    m = Image.frombytes("L", (w, h), bytes(mask))
    # 輪郭を1px内側に削ってから軽くぼかす。
    # 元画像の境界画素は白と混ざっているため、削らないと暗い背景で白い縁が出る。
    m = m.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(FEATHER))

    out = im.convert("RGBA")
    out.putalpha(m)

    # 余白なしで切り出す。製品の下端＝画像の下端になるので、
    # CSS側で接地影を置く位置が一意に決まる。
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)

    if out.width > MAX_WIDTH:
        out = out.resize((MAX_WIDTH, round(out.height * MAX_WIDTH / out.width)), Image.LANCZOS)

    out.save(dst, optimize=True)
    print(f"{dst}: {out.size[0]}x{out.size[1]}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
