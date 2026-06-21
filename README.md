# 配信スケジュールメーカー 📅

VTuber / YouTube Live 配信者向けの **週間スケジュール画像メーカー**。
16 種類のカラーテーマ × 12 種類のデザインテンプレートから選び、各曜日の配信予定を入力して、
**1280×720 の PNG 画像**としてワンクリックで書き出せます。

> 元は単一の React コンポーネント（Claude artifact）でした。それを Vite + React の
> デプロイ可能なプロジェクトとして再構成し、テンプレート保存を `localStorage` に移植したものです。

## ✨ 機能

- **12 デザイン**: かわいい / クリーン / ポップ / ストリーマー / ピクセル / エレガント / コミック / 和モダン / サイバー / パステル / ギャラクシー / グランジ
- **16 テーマ**: ライト 10 種 + ダーク 6 種のカラーパレット
- **週間スケジュール入力**: 開始日（月曜）を選ぶと各曜日の日付が自動計算
- **カスタム画像**: VTuber モデル等を重ねて配置（任意アップロード）
- **テンプレート保存**: 現在の設定を `localStorage` に保存・読込・削除、JSON でエクスポート/インポート
- **画像書き出し**: SVG → Canvas 経由で 1280×720 PNG をブラウザ内生成（外部ライブラリ不要）

## 🚀 ローカルで動かす

```bash
npm install      # 依存をインストール
npm run dev      # 開発サーバ起動（http://localhost:5173 など）
```

本番ビルドと確認:

```bash
npm run build    # dist/ に出力
npm run preview  # ビルド結果をローカルでプレビュー
```

## 🌐 デプロイ（GitHub Pages）

`.github/workflows/deploy.yml` により、`main` ブランチへ push すると自動でビルド & GitHub Pages へ公開されます。

1. GitHub リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定。
2. `main` に push する（または Actions タブから手動実行）。
3. 公開 URL は `https://<ユーザー名>.github.io/weekly-schedule-maker/`。

> **base パスについて**: `vite.config.js` の `base` は GitHub Pages 用に `"/weekly-schedule-maker/"` に設定しています。
> 独自ドメインや Vercel / Netlify のルート配信で使う場合は `base: "/"` に変更してください。

## 🛠 技術スタック

- [Vite](https://vitejs.dev/) 5
- [React](https://react.dev/) 18
- 追加の UI ライブラリ無し（スタイルはインライン、フォントは Google Fonts の Zen Maru Gothic）

## 📄 ライセンス

[MIT](./LICENSE)
