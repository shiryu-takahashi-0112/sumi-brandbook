"""ブランドブックを、画像・ロゴ・処理をすべて中に入れた単体HTMLに書き出す（Notionに貼る用）。

使い方:  python3 tools/export_single.py <公開先のURL> <出力フォルダ>
例:      python3 tools/export_single.py https://sumi-brandbook.example.workers.dev ~/.claude-work/sumi

アンケートの送り先（content.js の surveyEndpoint）は相対パスなので、
単体HTMLでは公開先の絶対URLに置き換える。こうしないとNotion上で回答を送れない。
"""
import base64, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIME = {".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg"}


def inline_images(js):
    def rep(m):
        path = os.path.join(ROOT, m.group(1))
        data = base64.b64encode(open(path, "rb").read()).decode()
        return '"data:%s;base64,%s"' % (MIME[os.path.splitext(path)[1]], data)
    return re.sub(r'"(assets/img/[^"/]+\.(?:svg|png|jpg))"', rep, js)


def main(origin, out_dir):
    read = lambda p: open(os.path.join(ROOT, p), encoding="utf-8").read()
    css = read("assets/css/book.css")
    content = inline_images(read("assets/js/content.js"))
    content = content.replace('surveyEndpoint: "/api/answers"',
                              'surveyEndpoint: "%s/api/answers"' % origin.rstrip("/"))
    assert origin in content, "surveyEndpoint を置き換えられなかった"
    book = inline_images(read("assets/js/book.js"))
    page = read("a/index.html")
    for v in "ab":
        h = page.replace('<link rel="stylesheet" href="../assets/css/book.css">', "<style>\n" + css + "\n</style>")
        h = h.replace('data-variant="a" data-base="../"', 'data-variant="%s" data-base=""' % v)
        h = h.replace('<script src="../assets/js/content.js"></script>', "<script>\n" + content + "\n</script>")
        h = h.replace('<script src="../assets/js/book.js"></script>', "<script>\n" + book + "\n</script>")
        h = h.replace("<title>SUMI — Brand Concept Book</title>", "<title>SUMI — Brand Concept Book（%s案）</title>" % v.upper())
        out = os.path.join(os.path.expanduser(out_dir), "sumi-brandbook-%s.html" % v)
        open(out, "w", encoding="utf-8").write(h)
        print(out, os.path.getsize(out))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
