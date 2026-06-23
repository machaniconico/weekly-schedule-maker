// 純粋ロジック層（UIから分離 / テスト対象）
// WeeklyScheduleMaker.jsx から共有する定数とユーティリティ。

export const DAYS_JA = ["月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日", "日曜日"];
export const DAYS_EN = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

// ダーク扱いするテーマID（プレビュー側の白/影の出し分けに使用）
export const DARK_THEME_IDS = ["midnight", "neon", "retro"];

// 与えられた日付を含む週の月曜日を返す（日曜始まりを月曜始まりへ補正）。
export function getMonday(d) {
  const dt = new Date(d);
  const day = dt.getDay();
  dt.setDate(dt.getDate() - day + (day === 0 ? -6 : 1));
  return dt;
}

// "M/D" 形式の短い日付文字列。
export function fmtDate(d) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// テーマがダーク系か。
export function isDk(t) {
  return DARK_THEME_IDS.includes(t.id);
}

// 空のスケジュール（7日分）を生成する。
export function emptySchedule() {
  return DAYS_JA.map(() => ({ text: "", time: "" }));
}

// 開始日(YYYY-MM-DD)を、その週の月曜日(YYYY-MM-DD)へスナップする。
// 不正な入力（暦に存在しない 2026-02-30 等を含む）は null を返す。
export function snapToMondayStr(dateStr) {
  if (!dateStr) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;
  const [, y, mo, da] = match.map(Number);
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  // ロールオーバーで暦に存在しない日付を弾く（例: 2026-02-30 → 3/2 になる）
  if (d.getFullYear() !== y || d.getMonth() + 1 !== mo || d.getDate() !== da) return null;
  const m = getMonday(d);
  // ローカルタイムでの YYYY-MM-DD（toISOString のUTCずれを避ける）
  const my = m.getFullYear();
  const mm = String(m.getMonth() + 1).padStart(2, "0");
  const md = String(m.getDate()).padStart(2, "0");
  return `${my}-${mm}-${md}`;
}

// インポートされたテンプレートオブジェクトを検証し、正規化して返す。
// 不正な構造（design欠如/schedule非配列）は Error を投げる（呼び出し側でユーザー通知）。
// 既知のID集合 opts.designIds / opts.themeCount を渡すと、未知design・範囲外themeIdx は
// 例外にせず安全な既定値へフォールバックする（インポート時のレンダリングクラッシュを防ぐ）。
export function validateTemplate(obj, opts = {}) {
  if (!obj || typeof obj !== "object") throw new Error("テンプレートがオブジェクトではありません");
  if (typeof obj.design !== "string" || !obj.design) throw new Error("design が不正です");
  if (!Array.isArray(obj.schedule)) throw new Error("schedule が配列ではありません");

  // schedule を7要素の {text,time} に正規化（過不足を吸収）。
  const schedule = Array.from({ length: 7 }, (_, i) => {
    const row = obj.schedule[i] || {};
    return {
      text: typeof row.text === "string" ? row.text : "",
      time: typeof row.time === "string" ? row.time : "",
    };
  });

  // 未知の design はレンダリング不能（PREVIEW[design] が undefined）なので既定へ。
  const { designIds, themeCount } = opts;
  let design = obj.design;
  if (Array.isArray(designIds) && designIds.length && !designIds.includes(design)) {
    design = designIds[0];
  }

  // themeIdx は範囲外だと THEMES[idx] が undefined になりクラッシュするため 0 にクランプ。
  let themeIdx = Number.isInteger(obj.themeIdx) && obj.themeIdx >= 0 ? obj.themeIdx : 0;
  if (Number.isInteger(themeCount) && themeCount > 0 && themeIdx >= themeCount) {
    themeIdx = 0;
  }

  return {
    name: typeof obj.name === "string" && obj.name ? obj.name : "インポート",
    design,
    themeIdx,
    title: typeof obj.title === "string" ? obj.title : "",
    schedule,
  };
}

// JSON文字列をパースしてテンプレートとして検証する。
export function parseTemplateJson(str, opts = {}) {
  const parsed = JSON.parse(str);
  return validateTemplate(parsed, opts);
}

// ダウンロード用のファイル名を生成する（拡張子なしのベース名）。
// タイトル・期間からファイルシステムに安全な名前を作る。
export function exportFilename(title, range, ext = "png") {
  // タイトルを安全化（ファイル名に使えない文字を除去、空白を _ に）
  const safeTitle = (title || "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 40);
  // 期間 "6/22 ー 6/28" → "6-22_6-28"
  const safeRange = (range || "")
    .replace(/[\sー―—~〜-]+/g, "_")
    .replace(/\//g, "-")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  const base = [safeTitle, safeRange].filter(Boolean).join("_") || "schedule";
  return `${base}.${ext}`;
}
