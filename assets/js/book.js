/* =========================================================================
   SUMI Brand Concept Book — ビューアー
   content.js のデータからページを組み立て、横めくりで閲覧させる。
   ページを増やす／文言を直すときは content.js だけを触ればよい。
   ========================================================================= */
(function () {
  "use strict";

  var CONFIG = window.SUMI_CONFIG;
  var PAGES = window.SUMI_PAGES;
  var VARIANTS = window.SUMI_VARIANTS;

  var body = document.body;
  var variantKey = body.dataset.variant;
  var base = body.dataset.base || "";
  var variant = VARIANTS[variantKey];

  if (!variant) {
    body.innerHTML = '<p style="padding:40px">パターンが指定されていません。</p>';
    return;
  }

  /* ---------- 小さなDOMヘルパー ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function add(parent) {
    for (var i = 1; i < arguments.length; i++) {
      if (arguments[i]) parent.appendChild(arguments[i]);
    }
    return parent;
  }
  function asset(path) { return base + path; }

  // 製品画像は透過PNG（影は焼き込まれていない）。
  // 接地影は .shot の疑似要素で描くので、img は必ずこのラッパーに入れる。
  function shot(cls) {
    var span = el("span", "shot");
    var img = el("img");
    img.src = asset(variant.productImage);
    img.alt = "SUMI カーディフューザー " + variant.label;
    add(span, img);
    var box = el("div", cls);
    add(box, span);
    return box;
  }

  // SUMIのロゴは必ずFigmaから書き出した公式SVGを使う。
  // 文字を組んで代用しない（ブランド規定・README参照）。
  function logo(cls) {
    var span = el("span", cls);
    var img = el("img");
    img.src = asset("assets/img/logo-white.svg");
    img.alt = CONFIG.brand;
    img.className = "logo";
    add(span, img);
    return span;
  }

  /* ---------- アンケートURL（見たパターンをクエリで渡す） ---------- */
  function surveyUrl() {
    var u = CONFIG.surveyUrl;
    return u + (u.indexOf("?") === -1 ? "?" : "&") + "v=" + variant.key;
  }

  /* ---------- ページ枠（ヘッダー＋本文＋フッター） ---------- */
  function shell(page, index, total) {
    var section = el("section", "page");
    section.dataset.index = String(index);

    var head = el("div", "head");
    add(head, el("div", "head__jp", page.labelJp), el("div", "head__en", page.labelEn));

    var bodyWrap = el("div", "page__body");

    var foot = el("div", "foot");
    add(
      foot,
      logo("foot__mark"),
      el("div", "foot__folio", pad(index + 1) + " / " + pad(total))
    );

    add(section, head, bodyWrap, foot);
    return { section: section, body: bodyWrap };
  }
  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function wrap() { return el("div", "wrap"); }

  /* ---------- レイアウトごとの組み立て ---------- */
  var renderers = {

    cover: function (page, i, total) {
      var section = el("section", "page cover");

      var photo = shot("cover__photo");

      var inner = el("div", "cover__inner");
      var meta = el("div", "cover__meta");
      add(meta, el("span", null, CONFIG.bookTitle), el("span", null, page.note));
      add(
        inner,
        logo("cover__mark"),
        el("hr", "tick"),
        el("div", "cover__tag", page.tagline),
        page.guide ? el("div", "cover__guide", page.guide.replace("{{count}}", String(total))) : null,
        meta
      );

      add(section, photo, el("div", "cover__scrim"), inner);
      return section;
    },


    concept: function (page, i, total) {
      var s = shell(page, i, total);
      var w = wrap();
      add(w, el("p", "display", page.display));
      var b = wrap();
      add(b, el("p", "body", page.body));
      var sc = wrap();
      var scenes = el("p", "mincho", page.scenes);
      scenes.style.whiteSpace = "pre-line";
      scenes.style.lineHeight = "2.1";
      scenes.style.opacity = "0.62";
      scenes.style.fontSize = "clamp(12px, 1.25vw, 15px)";
      scenes.style.margin = "0";
      add(sc, el("hr", "tick"), scenes);
      sc.style.display = "flex";
      sc.style.flexDirection = "column";
      sc.style.gap = "18px";
      var trio = el("div", "trio");
      (page.values || []).forEach(function (v) {
        var item = el("div", "trio__item");
        add(item, el("div", "trio__en", v[0]), el("div", "trio__jp", v[1]));
        add(trio, item);
      });

      add(s.body, w, b, sc, trio);
      return s.section;
    },

    story: function (page, i, total) {
      var s = shell(page, i, total);
      var w = wrap();
      add(w, el("p", "display display--sm", page.display));
      var b = wrap();
      page.paragraphs.forEach(function (p) { add(b, el("p", "body", p)); });
      var origin = el("div", "aside");
      add(origin,
        el("div", "aside__label", page.originLabel),
        el("p", "aside__text", page.origin));

      var c = wrap();
      var closing = el("p", "mincho", page.closing);
      closing.style.whiteSpace = "pre-line";
      closing.style.textAlign = "right";
      closing.style.lineHeight = "2";
      closing.style.opacity = "0.8";
      closing.style.fontSize = "clamp(13px, 1.4vw, 17px)";
      closing.style.margin = "0";
      add(c, closing);
      add(s.body, w, b, origin, c);
      return s.section;
    },



    product: function (page, i, total) {
      var s = shell(page, i, total);
      var grid = el("div", "product");

      var fig = shot("product__figure");

      var text = el("div", "product__text");
      add(text,
        el("p", "display display--sm", variant.productHeadline),
        el("p", "body", variant.productLead));

      var points = el("div", "points");
      variant.points.forEach(function (p) {
        var row = el("div", "point");
        add(row, el("div", "point__k", p[0]), el("div", "point__v", p[1]));
        add(points, row);
      });
      add(text, points, el("p", "note", page.note));

      add(grid, fig, text);
      add(s.body, grid);
      return s.section;
    },

    incar: function (page, i, total) {
      var s = shell(page, i, total);
      var w = wrap();
      add(w, el("p", "display display--sm", page.display));

      var frame = el("div", "incar__frame");
      if (variant.inCarImage) {
        var img = el("img");
        img.src = asset(variant.inCarImage);
        img.alt = "車内に取り付けたイメージ " + variant.label;
        add(frame, img);
      } else {
        add(frame, el("div", "incar__placeholder", page.placeholder));
      }

      var b = wrap();
      add(b, el("p", "body", page.body));
      if (page.note && variant.inCarImage) add(b, el("p", "note", page.note));

      var scent = el("div", "aside");
      add(scent,
        el("div", "aside__label", page.scentLabel),
        el("p", "aside__text", page.scent));

      add(s.body, w, frame, b, scent);
      return s.section;
    },


    price: function (page, i, total) {
      var s = shell(page, i, total);
      var w = wrap();
      w.style.display = "flex";
      w.style.flexDirection = "column";
      w.style.gap = "14px";
      add(w,
        el("div", "price__label", page.label),
        el("div", "price", page.price),
        el("hr", "tick"),
        el("p", "note", page.note));

      var q = wrap();
      q.style.display = "flex";
      q.style.flexDirection = "column";
      q.style.gap = "16px";
      add(q, el("p", "display display--sm", page.question), el("p", "body", page.body));

      add(s.body, w, q);
      return s.section;
    },

    survey: function (page, i, total) {
      var s = shell(page, i, total);
      var w = wrap();
      add(w, el("p", "display", page.display));
      var b = wrap();
      add(b, el("p", "body", page.body));

      var cta = el("a", "cta");
      cta.href = surveyUrl();
      cta.target = "_blank";
      cta.rel = "noopener";
      var left = el("div");
      add(left,
        el("div", "cta__main", page.cta),
        el("div", "cta__sub", CONFIG.surveyUrlIsPlaceholder ? "フォームURLは準備中です" : page.ctaSub));
      add(cta, left, el("div", "cta__arrow", "→"));
      if (CONFIG.surveyUrlIsPlaceholder) cta.setAttribute("aria-disabled", "true");

      var t = wrap();
      var thanks = el("p", "note", page.thanks);
      thanks.style.textAlign = "right";
      add(t, thanks);

      add(s.body, w, b, cta, t);
      return s.section;
    }
  };

  /* ---------- 組み立て ---------- */
  var pager = el("div", "pager");
  pager.id = "pager";
  var total = PAGES.length;

  PAGES.forEach(function (page, i) {
    var render = renderers[page.type];
    if (!render) return;
    pager.appendChild(render(page, i, total));
  });
  body.appendChild(pager);

  /* ---------- ナビゲーション ---------- */
  var prevZone = el("button", "nav-zone nav-zone--prev");
  prevZone.setAttribute("aria-label", "前のページ");
  var nextZone = el("button", "nav-zone nav-zone--next");
  nextZone.setAttribute("aria-label", "次のページ");

  var progress = el("div", "progress");
  var bar = el("div", "progress__bar");
  add(progress, bar);

  var hint = el("div", "hint", "SWIPE");
  add(body, prevZone, nextZone, progress, hint);

  // 現在ページは scrollLeft から都度計算せず変数で持つ。
  // スムーズスクロールの途中で連続操作されても、送った回数どおり進むようにするため。
  var target = 0;
  var settleTimer = null;

  function go(delta) {
    target = Math.min(Math.max(target + delta, 0), total - 1);
    pager.scrollTo({ left: target * pager.clientWidth, behavior: "smooth" });
  }
  prevZone.addEventListener("click", function () { go(-1); });
  nextZone.addEventListener("click", function () { go(1); });

  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); go(1); }
    if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(-1); }
  });

  function update() {
    var w = pager.clientWidth || 1;
    var ratio = (pager.scrollLeft / w + 1) / total;
    bar.style.width = Math.min(Math.max(ratio, 0), 1) * 100 + "%";
  }
  // スクロールが止まったら、指スワイプの結果を target に反映させる
  pager.addEventListener("scroll", function () {
    update();
    clearTimeout(settleTimer);
    settleTimer = setTimeout(function () {
      target = Math.round(pager.scrollLeft / (pager.clientWidth || 1));
    }, 130);
  }, { passive: true });

  // 画面回転などで幅が変わっても、同じページに留まる
  window.addEventListener("resize", function () {
    pager.scrollTo({ left: target * pager.clientWidth, behavior: "auto" });
    update();
  });
  update();

  // 最初のスワイプでヒントを消す
  var hideHint = function () {
    hint.style.opacity = "0";
    pager.removeEventListener("scroll", hideHint);
  };
  pager.addEventListener("scroll", hideHint, { passive: true });
  setTimeout(hideHint, 6000);
})();
