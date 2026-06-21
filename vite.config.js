import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages 配信用の base。リポジトリ名に合わせている。
// ユーザー独自ドメインや Vercel/Netlify へ出す場合は base を "/" に変更する。
export default defineConfig({
  plugins: [react()],
  base: "/weekly-schedule-maker/",
});
