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

  // ページ下部に敷く世界観カット。A/B共通（製品が写っていないので比較条件を崩さない）
  function band(page) {
    if (!page.image) return null;
    var box = el("div", "band");
    var img = el("img");
    img.src = asset(page.image);
    img.alt = "";
    add(box, img);
    return box;
  }

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

      add(s.body, w, b, sc, trio, band(page));
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
      closing.style.lineHeight = "2";
      closing.style.opacity = "0.8";
      closing.style.fontSize = "clamp(13px, 1.4vw, 17px)";
      closing.style.margin = "0";
      add(c, closing);
      add(s.body, w, b, origin, c, band(page));
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
      add(q, el("p", "display display--sm", page.statement), el("p", "body", page.body));

      add(s.body, w, q, band(page));
      return s.section;
    },

    survey: function (page, i, total) {
      var s = shell(page, i, total);
      var w = wrap();
      add(w, el("p", "display", page.display));
      var b = wrap();
      add(b, el("p", "body", page.body));

      var cta = el("button", "cta");
      cta.type = "button";
      var left = el("div");
      add(left,
        el("div", "cta__main", page.cta),
        el("div", "cta__sub", page.ctaSub));
      add(cta, left, el("div", "cta__arrow", "→"));
      cta.addEventListener("click", function () { openSurvey(); });

      var t = wrap();
      var thanks = el("p", "note", page.thanks);
      add(t, thanks);

      add(s.body, w, b, cta, t, band(page));
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
    if (surveyOpen) return;
    var t = e.target && e.target.tagName;
    if (t === "INPUT" || t === "TEXTAREA" || t === "BUTTON") return;
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
  /* ---------- アンケート ----------
     質問は content.js の SUMI_SURVEY。ブックの上に重ねて開き、
     答えは CONFIG.surveyEndpoint へ送って保存する。どちらの案を見たかも一緒に送る。 */
  var surveyOpen = false;
  var SURVEY = window.SUMI_SURVEY;

  function openSurvey() {
    if (!SURVEY) return;
    surveyOpen = true;
    var layer = buildSurvey();
    body.appendChild(layer);
    body.classList.add("is-survey");
    layer.scrollTop = 0;
  }

  function buildSurvey() {
    var layer = el("div", "survey");
    layer.setAttribute("role", "dialog");
    layer.setAttribute("aria-modal", "true");
    layer.setAttribute("aria-label", SURVEY.title);

    var inner = el("form", "survey__inner");
    inner.noValidate = true;

    var head = el("div", "survey__head");
    var close = el("button", "survey__close", "×");
    close.type = "button";
    close.setAttribute("aria-label", "ブックに戻る");
    close.addEventListener("click", function () { closeSurvey(layer); });
    var lead = el("p", "body survey__lead", SURVEY.lead);
    lead.style.whiteSpace = "pre-line";
    add(head, logo("survey__mark"), close);
    add(inner, head, el("p", "display display--sm", SURVEY.title), lead);

    var no = 0;
    var blocks = [];
    SURVEY.sections.forEach(function (sec) {
      var section = el("div", "survey__section");
      add(section, el("div", "aside__label", sec.title));
      sec.questions.forEach(function (q) {
        var block = question(q);
        blocks.push({ q: q, block: block });
        add(section, block);
      });
      add(inner, section);
    });

    // 前の答えで出し分ける質問の番号を振り直す
    function refresh() {
      no = 0;
      blocks.forEach(function (b) {
        var show = !b.q.showIf || matches(b.q.showIf);
        b.block.hidden = !show;
        if (show) b.block.querySelector(".q__no").textContent = "Q" + pad(++no);
        // 「その他」の記入欄は、その他を選んだときだけ出す
        var other = b.block.querySelector(".q__other");
        if (other) other.hidden = !b.block.querySelector('input[value="' + SURVEY.other + '"]').checked;
      });
    }
    function matches(cond) {
      var v = valueOf(inner, cond.id);
      return v != null && cond.in.indexOf(v) !== -1;
    }
    inner.addEventListener("change", refresh);
    refresh();

    var msg = el("p", "survey__msg");
    msg.setAttribute("role", "status");
    var submit = el("button", "cta survey__submit");
    submit.type = "submit";
    add(submit, el("div", "cta__main", SURVEY.submit), el("div", "cta__arrow", "→"));
    add(inner, msg, submit);

    inner.addEventListener("submit", function (e) {
      e.preventDefault();
      var answers = {};
      var firstMissing = null;
      blocks.forEach(function (b) {
        b.block.classList.remove("is-missing");
        if (b.block.hidden) return;
        collect(inner, b.q, answers);
        if (b.q.required && answers[b.q.id] == null) {
          b.block.classList.add("is-missing");
          if (!firstMissing) firstMissing = b.block;
        }
      });
      if (firstMissing) {
        msg.textContent = SURVEY.required;
        firstMissing.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      submit.disabled = true;
      msg.textContent = SURVEY.sending;
      fetch(CONFIG.surveyEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant: variant.key, answers: answers })
      }).then(function (r) {
        if (!r.ok) throw new Error("status " + r.status);
        showThanks(layer);
      }).catch(function () {
        submit.disabled = false;
        msg.textContent = SURVEY.error;
      });
    });

    add(layer, inner);
    return layer;
  }

  function question(q) {
    var block = el("fieldset", "q");
    var legend = el("legend", "q__title");
    add(legend, el("span", "q__no"), el("span", "q__text", q.q));
    add(block, legend);
    var name = "sv_" + q.id;

    if (q.type === "single" || q.type === "multi") {
      var list = el("div", "q__options");
      var opts = q.options.slice();
      if (q.allowOther) opts.push(SURVEY.other);
      opts.forEach(function (o, i) {
        var lab = el("label", "opt");
        var input = el("input");
        input.type = q.type === "single" ? "radio" : "checkbox";
        input.name = name;
        input.value = o;
        input.id = name + "_" + i;
        add(lab, input, el("span", "opt__text", o));
        add(list, lab);
      });
      add(block, list);
      if (q.allowOther) {
        var other = el("input", "q__input q__other");
        other.type = "text";
        other.name = name + "_other";
        other.placeholder = SURVEY.otherPlaceholder;
        add(block, other);
      }
    } else if (q.type !== "fields") {
      add(block, field({ id: q.id, type: q.type, placeholder: q.placeholder }));
    }
    // 選択肢の下に添える記入欄（香り・理由・金額など）
    (q.fields || []).forEach(function (f) { add(block, field(f)); });
    return block;
  }

  function field(f) {
    var box = el("label", "q__field");
    if (f.label) add(box, el("span", "q__label", f.label));
    var input;
    if (f.type === "textarea") {
      input = el("textarea", "q__input");
      input.rows = 3;
    } else {
      input = el("input", "q__input");
      input.type = f.type === "yen" ? "number" : "text";
      if (f.type === "yen") { input.inputMode = "numeric"; input.min = "0"; input.step = "100"; }
    }
    input.name = "sv_" + f.id;
    input.placeholder = f.placeholder || "";
    if (f.type === "yen") {
      var row = el("span", "q__yen");
      add(row, input, el("span", "q__unit", "円"));
      add(box, row);
    } else {
      add(box, input);
    }
    return box;
  }

  // 質問1つ分の答えを、保存する id ごとに集める（選択肢の答え＋添えた記入欄）
  function collect(form, q, into) {
    var ids = (q.type === "fields" ? [] : [q.id]).concat((q.fields || []).map(function (f) { return f.id; }));
    ids.forEach(function (id) {
      var v = valueOf(form, id);
      if (v != null && v !== "" && !(Array.isArray(v) && !v.length)) into[id] = v;
    });
  }

  // 1つの質問の答えを取り出す。複数選択は配列、「その他」は記入内容を添える
  function valueOf(form, id) {
    var name = "sv_" + id;
    var inputs = form.querySelectorAll('[name="' + name + '"]');
    if (!inputs.length) return null;
    var first = inputs[0];
    var otherBox = form.querySelector('[name="' + name + '_other"]');
    function withOther(v) {
      if (v === SURVEY.other && otherBox && otherBox.value.trim()) return SURVEY.other + "：" + otherBox.value.trim();
      return v;
    }
    if (first.type === "radio") {
      for (var i = 0; i < inputs.length; i++) if (inputs[i].checked) return withOther(inputs[i].value);
      return null;
    }
    if (first.type === "checkbox") {
      var out = [];
      for (var j = 0; j < inputs.length; j++) if (inputs[j].checked) out.push(withOther(inputs[j].value));
      return out;
    }
    var v = first.value.trim();
    if (first.type === "number") return v === "" ? null : Number(v);
    return v;
  }

  function showThanks(layer) {
    var inner = el("div", "survey__inner survey__thanks");
    var again = el("button", "cta");
    again.type = "button";
    add(again, el("div", "cta__main", SURVEY.restart), el("div", "cta__arrow", "→"));
    // 次の方に渡せるよう、ブックの表紙に戻して入力を残さない
    again.addEventListener("click", function () {
      closeSurvey(layer);
      target = 0;
      pager.scrollTo({ left: 0, behavior: "auto" });
    });
    add(inner, logo("survey__mark"), el("p", "display display--sm", SURVEY.thanksTitle),
      el("p", "body", SURVEY.thanksBody), again);
    layer.innerHTML = "";
    add(layer, inner);
    layer.scrollTop = 0;
  }

  function closeSurvey(layer) {
    surveyOpen = false;
    body.classList.remove("is-survey");
    if (layer.parentNode) layer.parentNode.removeChild(layer);
  }
})();
