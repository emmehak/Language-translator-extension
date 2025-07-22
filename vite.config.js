import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  publicDir: "public", // Makes sure manifest and icons are copied
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "index.html"),
        background: resolve(__dirname, "src/scripts/background.js"),
        content: resolve(__dirname, "src/scripts/content.js"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background" || chunkInfo.name === "content") {
            return "[name].js"; // Must output as content.js
          }
          return "assets/[name]-[hash].js";
        },
      },
    },
  },
});
