"""白背景の製品レンダリングを、製品だけの透過PNGに変換する。

元画像には白背景用のドロップシャドウが焼き込まれている。そのまま切り抜くと
暗い背景では製品の下に灰色の溜まりとして残る。

製品の底面と接地影は明度の階調でつながっているため、明度だけでは分離できない。
代わりに「鏡面には局所的な明暗差（構造）があり、影はなめらか」という差を使う。
行内の隣接画素の最大明暗差を見て、それが消えた行を製品の下端とする。

  使い方:  python3 tools/cutout.py assets/img/src/product-a.png assets/img/product-a.png
"""
import sys
from PIL import Image, ImageFilter

OUTLINE_MAX = 200     # 輪郭判定の明度。明るい鏡面リムの外周までここに収まる
STRUCTURE_MIN = 10    # 行内にこれ以上の明暗差があれば、まだ製品（鏡面）の行
STRUCTURE_RUN = 3     # 構造のない行がこの数だけ続いたら製品の下端とみなす
FADE_RATIO = 0.012    # 下端の切り口を消すフェード（シルエット高さに対する比率）
FEATHER = 1.1         # 輪郭のぼかし半径（px）
MAX_WIDTH = 1400      # web用の長辺


def luminance_rows(rgb, w, h):
    px = rgb.load()
    rows = []
    for y in range(h):
        row = bytearray(w)
        for x in range(w):
            r, g, b = px[x, y]
            m = r if r < g else g
            row[x] = b if b < m else m
        rows.append(row)
    return rows


def row_extents(rows, w):
    out = []
    for row in rows:
        left = right = -1
        for x in range(w):
            if row[x] <= OUTLINE_MAX:
                if left < 0:
                    left = x
                right = x
        out.append(None if left < 0 else (left, right))
    return out


def has_structure(row, e):
    """行内の隣接画素の最大明暗差。鏡面なら大きく、なめらかな影なら小さい。"""
    if not e or e[1] <= e[0]:
        return False
    for i in range(e[0], e[1]):
        if abs(row[i + 1] - row[i]) >= STRUCTURE_MIN:
            return True
    return False


def trim(rows, extents):
    """最も広い行から下へたどり、鏡面の構造が消えた行より下を落とす。
    あわせて、行幅が下に向かって広がらないよう制限し、影の裾を含めない。"""
    widths = [(e[1] - e[0] + 1) if e else -1 for e in extents]
    widest = widths.index(max(widths))

    quiet = 0
    bottom = len(extents)
    for y in range(widest + 1, len(extents)):
        if extents[y] is None:
            bottom = y
            break
        quiet = 0 if has_structure(rows[y], extents[y]) else quiet + 1
        if quiet >= STRUCTURE_RUN:
            bottom = y - quiet + 1
            break

    for y in range(bottom, len(extents)):
        extents[y] = None

    prev = extents[widest]
    for y in range(widest + 1, bottom):
        e = extents[y]
        if e is None:
            continue
        left, right = max(e[0], prev[0]), min(e[1], prev[1])
        extents[y] = prev = (left, right) if left <= right else prev
    return extents


def build_mask(extents, w, h):
    """行ごとに左端〜右端を塗る。製品は凸形状なので、内部の鏡面ハイライト
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
    """下端の切り口だけを数px分フェードさせて、水平の断面線を消す。"""
    rows = [y for y, e in enumerate(extents) if e]
    if not rows:
        return mask
    top, bottom = rows[0], rows[-1]
    span = max(int((bottom - top) * FADE_RATIO), 1)
    for i in range(span):
        y = bottom - i
        a = int(255 * (i + 1) / (span + 1))
        base = y * w
        for x in range(w):
            if mask[base + x]:
                mask[base + x] = a
    return mask


def main(src, dst):
    im = Image.open(src).convert("RGB")
    w, h = im.size

    rows = luminance_rows(im, w, h)
    extents = trim(rows, row_extents(rows, w))
    mask = fade_bottom(build_mask(extents, w, h), extents, w)

    m = Image.frombytes("L", (w, h), bytes(mask))
    # 輪郭を1px内側に削ってから軽くぼかす。
    # 元画像の境界画素は白と混ざっているため、削らないと暗い背景で白い縁が出る。
    m = m.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(FEATHER))

    out = im.convert("RGBA")
    out.putalpha(m)

    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)

    if out.width > MAX_WIDTH:
        out = out.resize((MAX_WIDTH, round(out.height * MAX_WIDTH / out.width)), Image.LANCZOS)

    out.save(dst, optimize=True)
    print(f"{dst}: {out.size[0]}x{out.size[1]}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
