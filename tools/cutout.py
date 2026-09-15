"""白背景の製品レンダリングを、暗い背景に自然に置ける透過PNGへ変換する。

元画像は白地に製品＋接地影が焼き込まれている。製品の底面と影は明度の階調で
つながっていて、どこで切っても不自然になる（切れば見切れ、残せば灰色の溜まり）。

そこで影を「消す」のではなく、背景に依存しない形へ変換する。
白地の影は  観測値 = 255 x k （k は遮光率）。任意の背景色 BG で同じ影を
再現するには BG x k にすればよく、これは「黒を不透明度 1-k で重ねる」ことと等しい。
つまり影の領域を color=黒 / alpha=1-明度/255 にすれば、どんな背景でも
物理的に正しい影になる。

    製品の領域 … 元の色をそのまま不透明で置く
    それ以外   … 黒 + alpha=1-明度/255（＝元のレンダリングの影そのもの）

製品領域の下端は、影の裾が横に張り出し始める行までとし、そこから下は
上の変換に任せる。境目はフェードさせるので、底面は自分の影へ溶けていく。

SHADOW = False にすると影を落とし、製品だけの切り抜きになる。

  使い方:  python3 tools/cutout.py assets/img/src/product-a.png assets/img/product-a.png
"""
import sys
from PIL import Image, ImageFilter

SHADOW = True        # 元のレンダリングの接地影を残すか
OUTLINE_MAX = 200    # 輪郭判定の明度。明るい鏡面リムの外周までここに収まる
FLARE_SLACK = 4      # この画素数を超えて幅が広がったら影の裾が始まったとみなす
BLEND_RATIO = 0.22   # 製品領域の下端を影へ溶かす距離（製品の高さに対する比率）
SHADOW_FLOOR = 0.03  # これ未満の薄い影は捨てて画像を軽くする
FEATHER = 1.1        # 輪郭のぼかし半径（px）
MAX_WIDTH = 1400     # web用の長辺


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


def product_mask(rows, extents, w, h):
    """製品の領域。行ごとに左端〜右端を塗るので、内部の鏡面ハイライト
    （白に近く閾値から漏れる部分）も過不足なく埋まる。"""
    widths = [(e[1] - e[0] + 1) if e else -1 for e in extents]
    widest = widths.index(max(widths))

    bottom = h
    for y in range(widest + 1, h):
        if widths[y] < 0 or widths[y] > widths[y - 1] + FLARE_SLACK:
            bottom = y
            break

    mask = bytearray(w * h)
    for y in range(bottom):
        e = extents[y]
        if not e:
            continue
        base = y * w
        for x in range(e[0], e[1] + 1):
            mask[base + x] = 255

    # 下端を影へ溶かす
    blend = int((bottom - widest) * BLEND_RATIO) or 1
    for i in range(blend):
        y = bottom - 1 - i
        if y < 0:
            break
        a = int(255 * (i + 1) / (blend + 1))
        base = y * w
        for x in range(w):
            if mask[base + x]:
                mask[base + x] = a
    return mask


def main(src, dst):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    px = im.load()

    rows = luminance_rows(im, w, h)
    mask = product_mask(rows, row_extents(rows, w), w, h)

    m = Image.frombytes("L", (w, h), bytes(mask))
    # 輪郭を1px内側に削ってからぼかす。元画像の境界画素は白と混ざっているため、
    # 削らないと暗い背景で白い縁が出る。
    m = m.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(FEATHER))
    mp = m.load()

    out = Image.new("RGBA", (w, h))
    op = out.load()
    floor = int(SHADOW_FLOOR * 255)

    for y in range(h):
        row = rows[y]
        for x in range(w):
            k = mp[x, y]                       # 製品らしさ 0..255
            shade = (255 - row[x]) if SHADOW else 0
            if shade < floor:
                shade = 0
            if k == 0:
                if shade:
                    op[x, y] = (0, 0, 0, shade)
                continue
            r, g, b = px[x, y]
            f = k / 255.0                      # 境目では製品の色を黒へ寄せる
            op[x, y] = (int(r * f), int(g * f), int(b * f), k if k >= shade else shade)

    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)

    if out.width > MAX_WIDTH:
        out = out.resize((MAX_WIDTH, round(out.height * MAX_WIDTH / out.width)), Image.LANCZOS)

    out.save(dst, optimize=True)
    print(f"{dst}: {out.size[0]}x{out.size[1]}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
