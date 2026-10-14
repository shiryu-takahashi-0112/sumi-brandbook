/* =========================================================================
   SUMI Brand Concept Book — コンテンツ定義
   ここが全ページのコピーの唯一の置き場所。HTML側は触らずにここだけ直す。
   ========================================================================= */

window.SUMI_CONFIG = {
  brand: "SUMI",
  bookTitle: "Brand Concept Book",

  // 回答の送り先。ブックの中でアンケートに答えると、ここへ送られて保存される（worker/index.js）。
  // どちらのパターンを見た回答かは、送るときに自動で付く。
  // Notionに貼る単体HTMLでは、書き出すときに公開先の絶対URLへ置き換える（tools/export_single.py）。
  surveyEndpoint: "/api/answers",

  // 入口（A案・B案を選ぶ画面）へ戻る導線の文言。表紙の左上と、アンケート送信後の画面に出る。
  // Notionに貼る単体HTMLには入口が無いので出さない。
  backToEntrance: "案の選択に戻る"
};

/* --------------------------------------------------------------------------
   アンケートの質問。ブック最後の「アンケートに回答する」で画面に出る。全10問。
   type: single（1つ選ぶ）/ multi（いくつでも）/ text（短い記入）/ fields（記入欄だけ）
   選択式の質問には必ず allowOther を付け、「その他」と自由記入の欄を出す（2026-10-10にShiryuから指示）
   fields: 選択肢の下に添える記入欄。答えは欄ごとの id で保存される
     （type は text / textarea / yen、yen は金額）
   showIf: 前の質問の答えによって出し分ける（{ id: 質問ID, in: [選択肢…] }）
   2026-10-06の定例MTGで決めた「絶対聞きたい」項目（使っているか・使わない理由・価格・形の種類・
   車の使い方・乗っている車・その車にデザインが合うか）はすべて入れ、似た質問は1問にまとめている。
   -------------------------------------------------------------------------- */
window.SUMI_SURVEY = {
  title: "アンケート",
  lead: "ご覧いただいたSUMIについて、いくつか教えてください。\n分かる範囲で、思ったままにお答えください。",
  submit: "回答を送る",
  sending: "送信しています…",
  error: "送信できませんでした。通信状況を確かめて、もう一度お試しください。",
  required: "この質問にお答えください。",
  thanksTitle: "ご協力ありがとうございました。",
  thanksBody: "いただいた回答は、SUMIのものづくりに活かします。",
  restart: "この案の表紙に戻る",
  other: "その他",
  otherPlaceholder: "具体的に",

  sections: [
    {
      title: "いまお使いのもの",
      questions: [
        {
          id: "use",
          type: "single",
          required: true,
          q: "車用のディフューザーや芳香剤を、いまお使いですか？",
          options: ["使っている", "以前は使っていたが、いまは使っていない", "使ったことがない"],
          allowOther: true
        },
        {
          id: "useType",
          type: "multi",
          q: "お使いの（お使いだった）ものの形と香り、値段を教えてください。",
          options: ["エアコンの吹き出し口に付けるタイプ", "置くタイプ", "ぶら下げるタイプ"],
          allowOther: true,
          fields: [
            { id: "useScent", type: "text", label: "香り", placeholder: "例：せっけん、ウッド、柑橘、無香料 など" },
            { id: "usePrice", type: "yen", label: "最後に買ったときの値段", placeholder: "例：1500" }
          ],
          showIf: { id: "use", in: ["使っている", "以前は使っていたが、いまは使っていない"] }
        },
        {
          id: "notUseReason",
          type: "multi",
          q: "使っていない（やめた）理由を教えてください。",
          options: [
            "車に香りを残したくない（売却や下取りを考えている）",
            "香りが強すぎる・好みに合うものがない",
            "見た目が車の雰囲気に合わない",
            "必要だと感じない"
          ],
          allowOther: true,
          showIf: { id: "use", in: ["以前は使っていたが、いまは使っていない", "使ったことがない"] }
        }
      ]
    },
    {
      title: "あなたとお車について",
      questions: [
        {
          id: "age",
          type: "single",
          q: "年齢と職業を教えてください。",
          options: ["20代", "30代", "40代", "50代", "60代以上"],
          allowOther: true,
          fields: [
            { id: "job", type: "text", label: "職業", placeholder: "例：会社員（営業）、経営者、自営業 など" }
          ]
        },
        {
          id: "carUse",
          type: "multi",
          q: "いま乗っている車と、その使い方を教えてください。",
          options: [
            "自分で運転し、一人で乗ることが多い",
            "自分で運転し、家族や子どもを乗せる",
            "自分で運転し、友人や恋人を乗せる",
            "仕事で使い、お客様や仕事の相手を乗せる",
            "自分はあまり運転しない"
          ],
          allowOther: true,
          fields: [
            { id: "car", type: "text", label: "メーカーと車種", placeholder: "例：レクサス RX" }
          ]
        }
      ]
    },
    {
      title: "SUMIについて",
      questions: [
        {
          id: "fit",
          type: "single",
          q: "ご覧いただいたデザインは、ご自身の車に合うと思いますか？付けたいと思いますか？",
          options: ["車に合うし、付けたい", "車には合うが、付けたいほどではない", "車に合わないと思う"],
          allowOther: true,
          fields: [
            { id: "fitReason", type: "textarea", label: "そう思った理由", placeholder: "自由にお書きください" }
          ]
        },
        {
          id: "wantType",
          type: "single",
          q: "付けるなら、どの形がよいですか？",
          options: ["エアコンの吹き出し口に付けるタイプ", "置くタイプ", "ぶら下げるタイプ", "こだわらない"],
          allowOther: true
        }
      ]
    },
    {
      title: "価格と購入について",
      questions: [
        {
          id: "price",
          type: "fields",
          q: "いくらなら買いますか？",
          fields: [
            { id: "priceBuy", type: "yen", label: "この値段なら買う", placeholder: "例：9000" },
            { id: "priceTooHigh", type: "yen", label: "高くて買わない", placeholder: "例：15000" }
          ]
        },
        {
          id: "refill",
          type: "single",
          q: "香りの詰め替え（リフィル）は、1回分いくらなら定期的に買いますか？",
          options: ["1,000円未満なら買う", "1,000〜2,000円なら買う", "2,000〜3,000円なら買う", "3,000円以上でも買う", "詰め替えは買わないと思う"],
          allowOther: true
        },
        {
          id: "buy",
          type: "single",
          q: "発売されたら、買うと思いますか？",
          options: ["すぐに買いたい", "しばらく様子を見る", "買わないと思う"],
          allowOther: true,
          fields: [
            { id: "contact", type: "text", label: "発売や先行予約のお知らせを受け取りたい方は、連絡先（任意）", placeholder: "メールアドレス または Instagramのアカウント" }
          ]
        }
      ]
    }
  ]
};

/* --------------------------------------------------------------------------
   A案 / B案の差分。ここに載っていない内容はすべて両パターン共通。
   -------------------------------------------------------------------------- */
window.SUMI_VARIANTS = {
  a: {
    key: "a",
    label: "デザイン案 A",
    productImage: "assets/img/product-a.png",
    inCarImage: "assets/img/in-car-a.jpg",
    productHeadline: "斜めに切り落とした一角に、\n光を溜める。",
    productLead:
      "木目の面の一角を斜めに切り落とし、鏡面のシルバーをのぞかせる。静かな佇まいの中に、ひとつだけ視線の止まる場所をつくりました。",
    points: [
      ["FORM", "非対称のカット"],
      ["FINISH", "鏡面とヘアラインの対比"],
      ["IMPRESSION", "静けさの中の、小さな動き"]
    ]
  },

  b: {
    key: "b",
    label: "デザイン案 B",
    productImage: "assets/img/product-b.png",
    inCarImage: "assets/img/in-car-b.jpg",
    productHeadline: "全周を受けるベゼルと、\n内側に刻んだリブ。",
    productLead:
      "木目の面をシルバーのベゼルで全周から受け、その内側に細いリブを刻む。正面から見ても、斜めから見ても崩れない、端正な対称性を追いました。",
    points: [
      ["FORM", "左右対称のベゼル"],
      ["FINISH", "微細なリブが生む陰影"],
      ["IMPRESSION", "揺らがない端正さ"]
    ]
  }
};

/* --------------------------------------------------------------------------
   ページ定義。順番がそのまま本のページ順になる。
   type がレイアウトの種類（book.js の renderers に対応）。
   -------------------------------------------------------------------------- */
window.SUMI_PAGES = [
  {
    type: "cover",
    tagline: "車と過ごす時間を、上質なひとときへ。",
    guide: "全{{count}}ページ・約2分　読み終えたらアンケートにご協力ください",
    note: "カーディフューザー（開発中）"
  },

  {
    type: "concept",
    image: "assets/img/scene-concept.jpg",
    labelJp: "コンセプト",
    labelEn: "Concept",
    display: "車と過ごす時間を、\n上質なひとときへ。",
    body:
      "私たちは、車という日常の空間に新たな価値を生み出し、何気なく過ごす時間を、心地よく豊かなひとときへ変えていく。",
    scenes:
      "朝、エンジンをかける瞬間。　一人で静かに過ごす時間。\n好きな音楽を聴きながら、少し遠回りをする帰り道。",
    values: [
      ["Design", "美しくあること"],
      ["Comfort", "心地よくあること"],
      ["Experience", "体験をつくること"]
    ]
  },

  {
    type: "story",
    image: "assets/img/scene-story.jpg",
    labelJp: "ブランドについて",
    labelEn: "Story",
    display: "車は、ただ移動するための場所ではない。",
    paragraphs: [
      "そこには、誰にも邪魔されない、自分だけの時間がある。香り、デザイン、素材、質感。目に見えるものだけでなく、その空間に漂う空気や、そこにいるときの感覚まで。一つひとつを丁寧に整えることで、何気ない時間を、心が静かに満たされるひとときへ変えていく。",
      "SUMIが目指すのは、華やかさを競うラグジュアリーではない。必要以上に主張せず、けれど、そこにあるだけで確かな違いを感じられる。静けさ、余白、繊細さ。日本の美意識を、現代のカーライフへ運んでいく。"
    ],
    originLabel: "名前の由来",
    origin:
      "「SUMI」には、澄みわたる空気のような清らかさと、自分だけの時間を過ごす静かな居場所という、二つの意味を重ねています。",
    closing: "目立つことではなく、感じること。\n飾ることではなく、整えること。"
  },

  {
    type: "product",
    labelJp: "プロダクト",
    labelEn: "Product",
    title: "カーディフューザー（開発中）",
    note: "※ 画像はイメージです。仕様・デザインは開発中のため変更となる場合があります。"
  },

  {
    type: "incar",
    labelJp: "車内での佇まい",
    labelEn: "In the car",
    display: "その空間に、違和感なく在る。",
    body:
      "主張するためではなく、空間に馴染むために。車内に置いたときに、もとからそこにあったように見えることを目指しています。",
    note: "※ 装着イメージです。車種により見え方は異なります。",
    scentLabel: "香りについて",
    scent:
      "香水のように強く主張する香りではなく、乗り込んだ瞬間に「空気が整っている」と感じられること。清潔感、透明感、静けさ、落ち着き。香りのラインナップは現在検討中です。",
    placeholder: "車内に取り付けたイメージは現在制作中です。"
  },

  {
    type: "price",
    image: "assets/img/scene-price.jpg",
    labelJp: "想定価格帯",
    labelEn: "Price",
    label: "想定価格帯（現段階）",
    price: "¥8,000 — ¥15,000",
    note: "※ 現時点の想定であり、確定価格ではありません。",
    statement: "日常に置くものとして、\nふさわしい価格を探しています。",
    body:
      "現段階では、この範囲で検討しています。どのように受け取られたかは、最後のアンケートでお聞かせください。"
  },

  {
    type: "survey",
    image: "assets/img/scene-survey.jpg",
    labelJp: "アンケート",
    labelEn: "Survey",
    display: "車内で過ごす時間が、\n人生を豊かにする。",
    body:
      "車を単なる移動のための場所ではなく、自分自身を整え、感性を満たし、心豊かに過ごせる場所へ。SUMIはいま、その入り口をつくろうとしています。",
    cta: "アンケートに回答する",
    ctaSub: "所要時間 約3分",
    thanks: "ご協力ありがとうございます。"
  }
];
