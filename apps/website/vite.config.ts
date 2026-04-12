import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import Icons from "unplugin-icons/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
  plugins: [
    Icons({ compiler: "jsx", jsx: "react" }),
    devtools(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});

export default config;
