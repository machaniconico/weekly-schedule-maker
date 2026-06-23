import { describe, it, expect } from "vitest";
import { buildExportSVG, DESIGNS, THEMES } from "../src/WeeklyScheduleMaker.jsx";

// 敵対的入力（XML特殊文字を含む）。buildExportSVG が内部で escapeXml して
// 不正SVG/インジェクション/壊れエンティティを生まないことを全デザインで保証する。
const ADV_TITLE = "<TT>&\"'";
const ADV_TEXT = "<XX>&'\"";
const ADV_TIME = "<TM>&";
const advSch = Array.from({ length: 7 }, (_, i) => ({ text: ADV_TEXT, time: ADV_TIME, date: 22 + i }));
const normalSch = Array.from({ length: 7 }, (_, i) => ({ text: `配信${i}`, time: "20:00〜", date: 22 + i }));

const count = (s, sub) => s.split(sub).length - 1;

describe("buildExportSVG（全デザイン）", () => {
  DESIGNS.forEach((d) => {
    describe(`design=${d.id}`, () => {
      const svg = buildExportSVG({
        designId: d.id,
        t: THEMES[0],
        sch: advSch,
        range: "6/22 ー 6/28",
        title: ADV_TITLE,
        img: null,
      });

      it("完全な <svg> 文書を返す", () => {
        expect(typeof svg).toBe("string");
        expect(svg.startsWith("<svg")).toBe(true);
        expect(svg.trimEnd().endsWith("</svg>")).toBe(true);
        expect(svg.length).toBeGreaterThan(800);
      });

      it("ユーザー入力が生タグとして注入されない（エスケープ済み）", () => {
        expect(svg).not.toContain("<XX>");
        expect(svg).not.toContain("<TT>");
        expect(svg).not.toContain("<TM>");
      });

      it("予定テキストがエスケープされて含まれる", () => {
        expect(svg).toContain("&lt;XX&gt;");
      });

      it("大文字化由来の壊れたエンティティ（&AMP; 等）を含まない", () => {
        expect(svg).not.toMatch(/&(AMP|LT|GT|QUOT);/);
      });

      it("<text> タグの開閉が一致する", () => {
        expect(count(svg, "<text")).toBe(count(svg, "</text>"));
      });
    });
  });

  it("通常入力でも全デザインが有効な <svg> を返す", () => {
    DESIGNS.forEach((d) => {
      const svg = buildExportSVG({
        designId: d.id,
        t: THEMES[5],
        sch: normalSch,
        range: "6/22 ー 6/28",
        title: "週間スケジュール",
        img: null,
      });
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg.trimEnd().endsWith("</svg>")).toBe(true);
      expect(count(svg, "<text")).toBe(count(svg, "</text>"));
    });
  });

  it("未知デザインIDでも clean にフォールバックして有効な <svg> を返す", () => {
    const svg = buildExportSVG({
      designId: "__unknown__",
      t: THEMES[0],
      sch: normalSch,
      range: "6/22 ー 6/28",
      title: "x",
      img: null,
    });
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.trimEnd().endsWith("</svg>")).toBe(true);
  });

  it("画像 href の二重引用符がエスケープされマークアップを壊さない", () => {
    const svg = buildExportSVG({
      designId: "streamer",
      t: THEMES[0],
      sch: normalSch,
      range: "6/22 ー 6/28",
      title: "x",
      img: 'data:image/png;base64,AAA"onerror="x',
    });
    // href 属性内の生 " は &quot; になっているはず
    expect(svg).not.toContain('"onerror="');
    expect(svg).toContain("&quot;onerror=&quot;");
  });
});
