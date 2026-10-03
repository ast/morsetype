import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  // Relative asset URLs, so the build works from any subpath (e.g. /morsetype/).
  base: "./",
  plugins: [solid()],
});
