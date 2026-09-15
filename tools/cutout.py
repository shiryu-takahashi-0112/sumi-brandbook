"""白背景の製品レンダリングを透過PNGに変換する。

Figma/ChatGPTから書き出した製品画像は白背景のため、黒地のブックにそのまま
置くと白い四角に見える。背景を透過させ、余白を詰めて書き出す。

  使い方:  python3 tools/cutout.py assets/img/src/product-a.png assets/img/product-a.png
"""
import sys
from PIL import Image

# 背景(≒253)から製品エッジ(≒235)までを不透明度のグラデーションにする閾値
TRANSPARENT_AT = 248   # これ以上明るければ完全に透明
OPAQUE_AT = 232        # これ以下の明るさなら完全に不透明
PAD_RATIO = 0.06       # トリミング後に残す余白


def build_alpha(rgb, w, h):
    px = rgb.load()
    span = TRANSPARENT_AT - OPAQUE_AT
    alpha = bytearray(w * h)
    for y in range(h):
        base = y * w
        for x in range(w):
            r, g, b = px[x, y]
            v = r if r < g else g
            if b < v:
                v = b
            if v >= TRANSPARENT_AT:
                a = 0
            elif v <= OPAQUE_AT:
                a = 255
            else:
                a = int((TRANSPARENT_AT - v) * 255 / span)
            alpha[base + x] = a
    return alpha


def fill_interior(alpha, w, h):
    """製品内部の鏡面ハイライト（白に近い）が抜けてしまうのを防ぐため、
    各行で不透明画素の左端〜右端を塗りつぶす。製品は閉じた一塊なので成立する。"""
    for y in range(h):
        base = y * w
        left = right = -1
        for x in range(w):
            if alpha[base + x] >= 250:
                if left < 0:
                    left = x
                right = x
        if left >= 0:
            for x in range(left, right + 1):
                alpha[base + x] = 255
    return alpha


def main(src, dst):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    alpha = fill_interior(build_alpha(im, w, h), w, h)

    out = im.convert("RGBA")
    out.putalpha(Image.frombytes("L", (w, h), bytes(alpha)))

    bbox = out.getbbox()
    if bbox:
        pad = int(max(bbox[2] - bbox[0], bbox[3] - bbox[1]) * PAD_RATIO)
        bbox = (max(bbox[0] - pad, 0), max(bbox[1] - pad, 0),
                min(bbox[2] + pad, w), min(bbox[3] + pad, h))
        out = out.crop(bbox)

    # web用に長辺1400pxへ
    if out.width > 1400:
        out = out.resize((1400, round(out.height * 1400 / out.width)), Image.LANCZOS)

    out.save(dst, optimize=True)
    print(f"{dst}: {out.size[0]}x{out.size[1]}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
