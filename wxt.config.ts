import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-svelte"],
  manifest: {
    name: "__MSG_extName__",
    description: "__MSG_extDesc__",
    default_locale: "en",
    action: {},
    permissions: ["storage", "unlimitedStorage"],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
