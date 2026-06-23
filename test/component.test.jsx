// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import WeeklyScheduleMaker from "../src/WeeklyScheduleMaker.jsx";

afterEach(() => {
  cleanup();
  try { localStorage.clear(); } catch {}
});
beforeEach(() => {
  try { localStorage.clear(); } catch {}
});

describe("WeeklyScheduleMaker（レンダリングスモーク）", () => {
  it("クラッシュせずマウントし、タイトルとプレビューSVGを表示", () => {
    const { container } = render(<WeeklyScheduleMaker />);
    expect(screen.getByText("配信スケジュールメーカー")).toBeTruthy();
    // プレビューの SVG が描画されている
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("12デザインのボタンが表示される", () => {
    render(<WeeklyScheduleMaker />);
    ["かわいい", "クリーン", "ポップ", "ストリーマー", "ピクセル", "エレガント",
     "コミック", "和モダン", "サイバー", "パステル", "ギャラクシー", "グランジ"]
      .forEach((name) => expect(screen.getByText(name)).toBeTruthy());
  });

  it("予定タブへ切替でき各曜日の入力欄が出る", () => {
    render(<WeeklyScheduleMaker />);
    fireEvent.click(screen.getByText("📝 予定"));
    expect(screen.getByText("各曜日の配信予定")).toBeTruthy();
    expect(screen.getByText("月曜日")).toBeTruthy();
    expect(screen.getByText("日曜日")).toBeTruthy();
    // 配信内容の入力欄が7つ
    expect(screen.getAllByPlaceholderText("配信内容")).toHaveLength(7);
  });

  it("タイトル入力やテーマ切替でクラッシュしない", () => {
    const { container } = render(<WeeklyScheduleMaker />);
    const titleInput = screen.getByPlaceholderText("Weekly Schedule");
    fireEvent.change(titleInput, { target: { value: "テスト配信 <&>" } });
    expect(titleInput.value).toBe("テスト配信 <&>");
    // テーマswatch（aria-labelで取得）をクリック
    const themeBtn = screen.getByLabelText("カラーテーマ: 桜ピンク");
    fireEvent.click(themeBtn);
    expect(themeBtn.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("デザイン切替でプレビューが維持される（全デザインでクラッシュしない）", () => {
    const { container } = render(<WeeklyScheduleMaker />);
    ["ピクセル", "エレガント", "サイバー", "グランジ", "和モダン"].forEach((name) => {
      fireEvent.click(screen.getByText(name));
      expect(container.querySelector("svg")).toBeTruthy();
    });
  });

  it("テンプレ保存→一覧に反映され localStorage に永続化", () => {
    render(<WeeklyScheduleMaker />);
    fireEvent.click(screen.getByText("💾 テンプレ"));
    fireEvent.change(screen.getByPlaceholderText("テンプレート名"), { target: { value: "my-template" } });
    fireEvent.click(screen.getByText("保存する"));
    expect(screen.getByText("my-template")).toBeTruthy();
    const stored = JSON.parse(localStorage.getItem("my-templates"));
    expect(Array.isArray(stored)).toBe(true);
    expect(stored[0].name).toBe("my-template");
  });

  it("ドラフトが localStorage にあると次回マウントで復元される", () => {
    localStorage.setItem(
      "current-draft",
      JSON.stringify({ design: "clean", themeIdx: 1, title: "復元タイトル", startDate: "2026-06-22", schedule: [] })
    );
    render(<WeeklyScheduleMaker />);
    expect(screen.getByDisplayValue("復元タイトル")).toBeTruthy();
  });
});
