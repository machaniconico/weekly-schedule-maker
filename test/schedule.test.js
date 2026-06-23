import { describe, it, expect } from "vitest";
import {
  getMonday,
  fmtDate,
  isDk,
  emptySchedule,
  snapToMondayStr,
  validateTemplate,
  parseTemplateJson,
  exportFilename,
  escapeXml,
  DAYS_JA,
  DARK_THEME_IDS,
} from "../src/lib/schedule.js";

describe("getMonday", () => {
  it("水曜日からその週の月曜日を返す", () => {
    // 2026-06-24 は水曜
    const m = getMonday(new Date("2026-06-24T12:00:00"));
    expect(m.getFullYear()).toBe(2026);
    expect(m.getMonth()).toBe(5); // 6月
    expect(m.getDate()).toBe(22); // 月曜
  });

  it("日曜日は前の月曜日を返す（週またぎ補正）", () => {
    // 2026-06-28 は日曜
    const m = getMonday(new Date("2026-06-28T12:00:00"));
    expect(m.getDate()).toBe(22);
  });

  it("月曜日はその日を返す", () => {
    const m = getMonday(new Date("2026-06-22T12:00:00"));
    expect(m.getDate()).toBe(22);
  });
});

describe("fmtDate", () => {
  it("M/D 形式で返す", () => {
    expect(fmtDate(new Date("2026-06-22T00:00:00"))).toBe("6/22");
    expect(fmtDate(new Date("2026-01-05T00:00:00"))).toBe("1/5");
  });
});

describe("isDk", () => {
  it("ダークテーマIDを判定する", () => {
    expect(isDk({ id: "midnight" })).toBe(true);
    expect(isDk({ id: "neon" })).toBe(true);
    expect(isDk({ id: "aqua" })).toBe(false);
  });
  it("DARK_THEME_IDS と整合する", () => {
    DARK_THEME_IDS.forEach((id) => expect(isDk({ id })).toBe(true));
  });
});

describe("emptySchedule", () => {
  it("7日分の空行を返す", () => {
    const s = emptySchedule();
    expect(s).toHaveLength(7);
    expect(s.every((r) => r.text === "" && r.time === "")).toBe(true);
  });
  it("DAYS_JA と同じ長さ", () => {
    expect(emptySchedule()).toHaveLength(DAYS_JA.length);
  });
});

describe("snapToMondayStr", () => {
  it("週内の任意の日を月曜の YYYY-MM-DD にスナップ", () => {
    expect(snapToMondayStr("2026-06-24")).toBe("2026-06-22");
    expect(snapToMondayStr("2026-06-28")).toBe("2026-06-22");
    expect(snapToMondayStr("2026-06-22")).toBe("2026-06-22");
  });
  it("不正入力は null", () => {
    expect(snapToMondayStr("")).toBeNull();
    expect(snapToMondayStr(null)).toBeNull();
    expect(snapToMondayStr("not-a-date")).toBeNull();
  });
  it("月/年をまたぐ補正でもUTCずれしない", () => {
    // 2026-01-01 は木曜 → 月曜は 2025-12-29
    expect(snapToMondayStr("2026-01-01")).toBe("2025-12-29");
  });
  it("暦に存在しない日付（2026-02-30 等）は null", () => {
    expect(snapToMondayStr("2026-02-30")).toBeNull();
    expect(snapToMondayStr("2026-13-01")).toBeNull();
    expect(snapToMondayStr("2026-00-10")).toBeNull();
  });
  it("YYYY-MM-DD 以外のフォーマットは null", () => {
    expect(snapToMondayStr("2026/06/22")).toBeNull();
    expect(snapToMondayStr("6-22-2026")).toBeNull();
  });
});

describe("validateTemplate", () => {
  const valid = {
    name: "テスト",
    design: "kawaii",
    themeIdx: 3,
    title: "週間",
    schedule: [{ text: "配信", time: "20:00" }],
  };

  it("正常テンプレートを正規化（schedule を7行に補完）", () => {
    const r = validateTemplate(valid);
    expect(r.design).toBe("kawaii");
    expect(r.themeIdx).toBe(3);
    expect(r.schedule).toHaveLength(7);
    expect(r.schedule[0]).toEqual({ text: "配信", time: "20:00" });
    expect(r.schedule[6]).toEqual({ text: "", time: "" });
  });

  it("name 欠如時はデフォルト名", () => {
    const r = validateTemplate({ design: "clean", schedule: [] });
    expect(r.name).toBe("インポート");
  });

  it("themeIdx が不正なら 0", () => {
    expect(validateTemplate({ design: "pop", schedule: [], themeIdx: -5 }).themeIdx).toBe(0);
    expect(validateTemplate({ design: "pop", schedule: [], themeIdx: "x" }).themeIdx).toBe(0);
  });

  it("design 欠如で例外", () => {
    expect(() => validateTemplate({ schedule: [] })).toThrow();
  });

  it("schedule が配列でないと例外", () => {
    expect(() => validateTemplate({ design: "pop", schedule: "x" })).toThrow();
  });

  it("null で例外", () => {
    expect(() => validateTemplate(null)).toThrow();
  });

  it("余分な schedule 行は7行に切り詰め", () => {
    const many = { design: "pop", schedule: Array.from({ length: 12 }, () => ({ text: "a", time: "b" })) };
    expect(validateTemplate(many).schedule).toHaveLength(7);
  });

  it("opts.designIds 指定時、未知の design は既定(先頭)へフォールバック", () => {
    const r = validateTemplate(
      { design: "unknown-xyz", schedule: [] },
      { designIds: ["kawaii", "clean"], themeCount: 16 }
    );
    expect(r.design).toBe("kawaii");
  });

  it("opts.designIds 指定時、既知の design はそのまま", () => {
    const r = validateTemplate(
      { design: "clean", schedule: [] },
      { designIds: ["kawaii", "clean"] }
    );
    expect(r.design).toBe("clean");
  });

  it("opts.themeCount 指定時、範囲外 themeIdx は 0 にクランプ", () => {
    const r = validateTemplate(
      { design: "kawaii", schedule: [], themeIdx: 999 },
      { themeCount: 16 }
    );
    expect(r.themeIdx).toBe(0);
  });

  it("opts なしでは未知 design もそのまま（後方互換・寛容）", () => {
    expect(validateTemplate({ design: "anything", schedule: [] }).design).toBe("anything");
  });
});

describe("escapeXml", () => {
  it("XML特殊文字をエスケープ", () => {
    expect(escapeXml('<a href="x" b=\'y\'>&z')).toBe(
      "&lt;a href=&quot;x&quot; b=&#39;y&#39;&gt;&amp;z"
    );
  });
  it("& を最初に処理して二重エスケープしない", () => {
    expect(escapeXml("&lt;")).toBe("&amp;lt;");
  });
  it("null/undefined は空文字", () => {
    expect(escapeXml(null)).toBe("");
    expect(escapeXml(undefined)).toBe("");
  });
  it("通常文字はそのまま", () => {
    expect(escapeXml("配信 20:00〜")).toBe("配信 20:00〜");
  });
  it("数値も文字列化して処理", () => {
    expect(escapeXml(22)).toBe("22");
  });
});

describe("exportFilename", () => {
  it("タイトルと期間からファイル名を生成", () => {
    expect(exportFilename("週間スケジュール", "6/22 ー 6/28", "png")).toBe("週間スケジュール_6-22_6-28.png");
  });
  it("拡張子を切り替えられる", () => {
    expect(exportFilename("test", "1/1 ー 1/7", "svg")).toBe("test_1-1_1-7.svg");
  });
  it("タイトル空なら期間のみ", () => {
    expect(exportFilename("", "6/22 ー 6/28", "png")).toBe("6-22_6-28.png");
  });
  it("両方空なら既定名 schedule", () => {
    expect(exportFilename("", "", "png")).toBe("schedule.png");
  });
  it("ファイル名に使えない文字を除去", () => {
    expect(exportFilename('a/b:c*?"<>|', "1/1 ー 1/7", "png")).toBe("abc_1-1_1-7.png");
  });
  it("空白はアンダースコアに、長すぎるタイトルは切り詰め", () => {
    const longTitle = "あ".repeat(60);
    const r = exportFilename(longTitle, "", "png");
    expect(r.endsWith(".png")).toBe(true);
    expect(r.replace(".png", "").length).toBeLessThanOrEqual(40);
  });
  it("拡張子デフォルトは png", () => {
    expect(exportFilename("x", "")).toBe("x.png");
  });
});

describe("parseTemplateJson", () => {
  it("正常JSONをパース・検証", () => {
    const json = JSON.stringify({ design: "kawaii", schedule: [{ text: "x", time: "y" }] });
    const r = parseTemplateJson(json);
    expect(r.design).toBe("kawaii");
    expect(r.schedule).toHaveLength(7);
  });
  it("不正JSONで例外", () => {
    expect(() => parseTemplateJson("{not json")).toThrow();
  });
  it("JSONだがテンプレートとして不正なら例外", () => {
    expect(() => parseTemplateJson('{"foo":1}')).toThrow();
  });
});
