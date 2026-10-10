/* =========================================================================
   SUMI Brand Concept Book — 回答の受け取りと一覧
   /api/answers  … ブックのアンケートから回答を受け取り、D1に保存する
   /results      … 回答の一覧（Basic認証。パスワードはシークレット RESULTS_PASSWORD）
   それ以外は静的ファイル（ブック本体）をそのまま返す。
   ========================================================================= */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
const MAX_BODY = 20000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/answers") {
      if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
      if (request.method !== "POST") return json({ error: "method" }, 405);
      return saveAnswer(request, env);
    }

    if (url.pathname === "/results" || url.pathname.startsWith("/results/")) {
      const denied = checkAuth(request, env);
      if (denied) return denied;
      if (url.pathname === "/results/data.json") return listAnswers(env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function saveAnswer(request, env) {
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ error: "too large" }, 413);
  let data;
  try { data = JSON.parse(text); } catch { return json({ error: "json" }, 400); }
  const variant = data && data.variant;
  const answers = data && data.answers;
  if (variant !== "a" && variant !== "b") return json({ error: "variant" }, 400);
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return json({ error: "answers" }, 400);

  await env.DB.prepare("INSERT INTO answers (variant, answers) VALUES (?, ?)")
    .bind(variant, JSON.stringify(answers)).run();
  return json({ ok: true });
}

async function listAnswers(env) {
  const { results } = await env.DB.prepare(
    "SELECT id, created_at, variant, answers FROM answers ORDER BY id DESC"
  ).all();
  const rows = results.map(r => ({ ...r, answers: JSON.parse(r.answers) }));
  return new Response(JSON.stringify(rows), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

// 一覧は個人の連絡先も含むので、パスワードを知っている人だけが見られるようにする
function checkAuth(request, env) {
  if (!env.RESULTS_PASSWORD) {
    return new Response("回答一覧のパスワードがまだ設定されていません。", {
      status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
  const header = request.headers.get("Authorization") || "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const [, pass] = atob(encoded).split(":");
    if (pass === env.RESULTS_PASSWORD) return null;
  }
  return new Response("認証が必要です。", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="SUMI results", charset="UTF-8"', "Content-Type": "text/plain; charset=utf-8" }
  });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json", ...CORS }
  });
}
