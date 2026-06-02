import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "作業集中ブロッカー",
    description:
      "作業時間中にホワイトリスト外のWebページ閲覧をブロックし、集中をサポートします",
    version: "0.1.0",
    permissions: ["storage", "alarms", "tabs", "webNavigation"],
    host_permissions: ["<all_urls>"],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
