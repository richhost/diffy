import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-svelte"],
  manifest: {
    name: "Diffy",
    description:
      "Visual JSON diff tool. Create JSON nodes, connect them, and instantly see what changed — field by field.",
    action: {},
    permissions: ["storage", "unlimitedStorage"],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
